#!/usr/bin/env bash
# Builds and starts one release on the server (called by deploy/push.sh; run as root).
#
#   bash remote-deploy.sh <release-name> [--data /tmp/khilona-data.json /tmp/khilona-uploads.tgz [--replace]]
#
# The release folder /opt/khilona/releases/<release-name> must already contain the code. Steps:
# link the shared env files, install + build the API, storefront and admin, apply database
# migrations, optionally import catalogue data, switch /opt/khilona/current and reload PM2.
set -euo pipefail

BASE=/opt/khilona
SHARED="$BASE/shared"
APP_USER=khilona
REL_NAME="${1:?release name required}"
REL="$BASE/releases/$REL_NAME"
shift
DATA_JSON=""; DATA_TGZ=""; REPLACE=""
if [ "${1:-}" = "--data" ]; then DATA_JSON="$2"; DATA_TGZ="$3"; [ "${4:-}" = "--replace" ] && REPLACE="--replace"; fi

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
as_app() { sudo -u "$APP_USER" -H bash -c "export NODE_OPTIONS=--max-old-space-size=1536; $*"; }

[ -d "$REL" ] || { echo "Missing $REL"; exit 1; }
[ -f "$SHARED/config" ] || { echo "Run setup-server.sh first"; exit 1; }
. "$SHARED/config"

log "Release $REL_NAME"
ln -sfn "$SHARED/env/backend.env" "$REL/khilona_backend/.env"
ln -sfn "$SHARED/env/userpanel.env" "$REL/khilona_userpanel/.env.local"
ln -sfn "$SHARED/env/adminpanel.env" "$REL/khilona_adminpanel/.env.local"
chown -R "$APP_USER:$APP_USER" "$REL"

log "API: install, build, migrate"
as_app "cd '$REL/khilona_backend' && npm ci --no-audit --no-fund --loglevel=error && npx prisma generate && npm run build && npx prisma migrate deploy"

log "Storefront: install, build"
as_app "cd '$REL/khilona_userpanel' && npm ci --no-audit --no-fund --loglevel=error && npm run build"

log "Admin panel: install, build"
as_app "cd '$REL/khilona_adminpanel' && npm ci --no-audit --no-fund --loglevel=error && npm run build"

if [ -n "$DATA_TGZ" ] && [ -f "$DATA_TGZ" ]; then
  log "Images → $SHARED/uploads"
  tar -xzf "$DATA_TGZ" -C "$SHARED/uploads"
  chown -R "$APP_USER:$APP_USER" "$SHARED/uploads"
  find "$SHARED/uploads" -type d -exec chmod 755 {} + && find "$SHARED/uploads" -type f -exec chmod 644 {} +
fi
if [ -n "$DATA_JSON" ] && [ -f "$DATA_JSON" ]; then
  log "Catalogue data import"
  chmod 644 "$DATA_JSON"
  as_app "cd '$REL/khilona_backend' && npx tsx prisma/transfer-import.ts '$DATA_JSON' --from http://localhost:4000/uploads --to https://api.$DOMAIN/uploads $REPLACE"
fi

log "Switch to the new release"
ln -sfn "$REL" "$BASE/current"
as_app "cd '$BASE/current' && pm2 startOrReload deploy/ecosystem.config.cjs --update-env && pm2 save"

log "Health checks"
ok=1
for i in $(seq 1 30); do curl -fsS -o /dev/null http://127.0.0.1:4000/api/health && break; sleep 2; [ "$i" = 30 ] && ok=0; done
for url in http://127.0.0.1:3000/ http://127.0.0.1:3001/login; do
  for i in $(seq 1 30); do curl -fsS -o /dev/null "$url" && break; sleep 2; [ "$i" = 30 ] && ok=0; done
done
pm2_list=$(as_app "pm2 jlist" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{for(const p of JSON.parse(d))console.log(p.name.padEnd(16),p.pm2_env.status,'restarts='+p.pm2_env.restart_time)}catch{console.log(d)}})")
echo "$pm2_list"

# refresh the storefront cache after data changes
REVALIDATE_SECRET=$(grep -E '^REVALIDATE_SECRET=' "$SHARED/env/userpanel.env" | cut -d= -f2-)
curl -fsS -X POST -H "x-revalidate-secret: $REVALIDATE_SECRET" http://127.0.0.1:3000/api/revalidate >/dev/null 2>&1 || true

log "Clean up old releases (keep 3)"
ls -1dt "$BASE"/releases/*/ | tail -n +4 | xargs -r rm -rf

if [ "$ok" = 1 ]; then
  log "Deployed $REL_NAME — https://$DOMAIN  ·  https://admin.$DOMAIN  ·  https://api.$DOMAIN/api/health"
else
  echo "Some services did not answer. Logs: sudo -u $APP_USER pm2 logs --lines 80"; exit 1
fi
