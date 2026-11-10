#!/usr/bin/env bash
# One-time (and safe to re-run) server setup for White Monkey Toys on Ubuntu 22.04/24.04 or Debian 12.
#
#   sudo bash setup-server.sh <domain> [email-for-ssl-certificates]
#   e.g. sudo bash setup-server.sh whitemonkeytoys.in owner@gmail.com
#
# Installs Node.js 20, PostgreSQL, Nginx, Certbot, PM2 and a firewall; creates the database, the
# `khilona` system user, /opt/khilona (releases, shared uploads, env files with random secrets) and
# the Nginx sites:  <domain> + www  → storefront :3000,  admin.<domain> → admin :3001,
# api.<domain> → API :4000 (+ /uploads served directly). HTTPS is enabled automatically once the
# four DNS records point at this server (re-run this script after adding them).
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
APP_USER=khilona
BASE=/opt/khilona
SHARED="$BASE/shared"

log() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m!! %s\033[0m\n' "$*"; }

[ -n "$DOMAIN" ] || { echo "Usage: sudo bash setup-server.sh <domain> [email]"; exit 1; }
DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN#www.}"; DOMAIN="${DOMAIN%%/*}"
[ "$(id -u)" -eq 0 ] || { echo "Run as root: sudo bash setup-server.sh $DOMAIN"; exit 1; }
. /etc/os-release
case "$ID" in ubuntu | debian) ;; *) echo "Unsupported OS '$ID' (needs Ubuntu or Debian)"; exit 1 ;; esac

export DEBIAN_FRONTEND=noninteractive

log "System packages"
apt-get update -y
apt-get install -y sudo curl ca-certificates gnupg git nginx ufw certbot python3-certbot-nginx build-essential openssl rsync postgresql postgresql-contrib
systemctl enable --now postgresql nginx

log "Node.js 20 + PM2"
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
command -v pm2 >/dev/null 2>&1 || npm install -g pm2@5 --no-audit --no-fund
node -v

log "Swap (Next.js builds need memory)"
MEM_MB=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
if [ "$MEM_MB" -lt 3500 ] && ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "added 2 GB swap (RAM ${MEM_MB} MB)"
else
  echo "RAM ${MEM_MB} MB, swap: $(swapon --show --noheadings | wc -l) device(s)"
fi

log "App user and folders"
id -u "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir "$BASE/home" --shell /bin/bash "$APP_USER"
mkdir -p "$BASE/releases" "$SHARED/env" "$SHARED/uploads" "$SHARED/logs"
echo "DOMAIN=$DOMAIN" > "$SHARED/config"
chown -R "$APP_USER:$APP_USER" "$BASE"

log "Database (PostgreSQL, UTF-8)"
if [ ! -f "$SHARED/env/backend.env" ]; then
  DB_PASS=$(openssl rand -hex 24)
  JWT_SECRET=$(openssl rand -hex 48)
  REVALIDATE_SECRET=$(openssl rand -hex 24)
  sudo -u postgres psql -v ON_ERROR_STOP=1 -q <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'khilona') THEN CREATE ROLE khilona LOGIN PASSWORD '$DB_PASS';
  ELSE ALTER ROLE khilona WITH LOGIN PASSWORD '$DB_PASS'; END IF;
END \$\$;
SQL
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = 'khilona'" | grep -q 1; then
    sudo -u postgres createdb -O khilona -E UTF8 -T template0 --locale=C khilona
  fi
  sudo -u postgres psql -d khilona -qc "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

  cat > "$SHARED/env/backend.env" <<ENV
NODE_ENV=production
PORT=4000
APP_URL=https://api.$DOMAIN
TRUST_PROXY=true
SWAGGER_ENABLED=false
DATABASE_URL=postgresql://khilona:$DB_PASS@127.0.0.1:5432/khilona?schema=public
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_TTL_DAYS=7
CUSTOMER_REFRESH_TOKEN_TTL_DAYS=30
PASSWORD_RESET_TTL_MINUTES=30
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
COOKIE_DOMAIN=
CORS_ORIGIN=https://$DOMAIN,https://www.$DOMAIN,https://admin.$DOMAIN
STOREFRONT_URL=https://$DOMAIN
STOREFRONT_REVALIDATE_SECRET=$REVALIDATE_SECRET
APP_TIMEZONE=Asia/Kolkata
ORDER_NUMBER_PREFIX=WMT
ORDERS_REQUIRE_LOGIN=true
THROTTLE_GLOBAL_LIMIT=300
THROTTLE_LOGIN_LIMIT=5
THROTTLE_ORDER_LIMIT=10
THROTTLE_TRACK_LIMIT=20
STORAGE_PROVIDER=local
STORAGE_LOCAL_DIR=$SHARED/uploads
STORAGE_PUBLIC_URL=https://api.$DOMAIN/uploads
UPLOAD_MAX_FILE_SIZE_MB=5
ENV
  cat > "$SHARED/env/userpanel.env" <<ENV
NEXT_PUBLIC_API_URL=https://api.$DOMAIN/api
NEXT_PUBLIC_SITE_URL=https://$DOMAIN
API_URL=http://127.0.0.1:4000/api
NEXT_PUBLIC_IMAGE_HOSTS=api.$DOMAIN
REVALIDATE_SECRET=$REVALIDATE_SECRET
ENV
  cat > "$SHARED/env/adminpanel.env" <<ENV
NEXT_PUBLIC_API_URL=https://api.$DOMAIN/api
NEXT_PUBLIC_STOREFRONT_URL=https://$DOMAIN
NEXT_PUBLIC_IMAGE_HOSTS=api.$DOMAIN
ENV
  chown "$APP_USER:$APP_USER" "$SHARED"/env/*.env
  chmod 600 "$SHARED"/env/*.env
  echo "created database + env files with random secrets in $SHARED/env"
else
  echo "env files already exist — kept (secrets unchanged)"
fi

log "Nginx"
SITE=/etc/nginx/sites-available/khilona
if [ -f "$SITE" ] && grep -q "ssl_certificate" "$SITE" && grep -q "server_name $DOMAIN;" "$SITE"; then
  echo "site config already has HTTPS from certbot — kept"
else
cat > "$SITE" <<NGINX
# White Monkey Toys — managed by /opt/khilona/setup-server.sh
map \$http_upgrade \$connection_upgrade { default upgrade; '' close; }

server {
  listen 80;
  server_name www.$DOMAIN;
  return 301 \$scheme://$DOMAIN\$request_uri;
}

server {
  listen 80;
  server_name $DOMAIN;
  client_max_body_size 2m;
  location / {
    proxy_pass http://127.0.0.1:3000;
    include /etc/nginx/khilona-proxy.conf;
  }
}

server {
  listen 80;
  server_name admin.$DOMAIN;
  client_max_body_size 2m;
  location / {
    proxy_pass http://127.0.0.1:3001;
    include /etc/nginx/khilona-proxy.conf;
  }
}

server {
  listen 80;
  server_name api.$DOMAIN;
  client_max_body_size 8m;
  location /uploads/ {
    alias $SHARED/uploads/;
    access_log off;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
    add_header Access-Control-Allow-Origin "*";
    try_files \$uri =404;
  }
  location / {
    proxy_pass http://127.0.0.1:4000;
    include /etc/nginx/khilona-proxy.conf;
  }
}
NGINX
fi
cat > /etc/nginx/khilona-proxy.conf <<'PROXY'
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $connection_upgrade;
proxy_read_timeout 60s;
PROXY
# gzip for text responses
cat > /etc/nginx/conf.d/khilona-gzip.conf <<'GZIP'
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
GZIP
ln -sfn /etc/nginx/sites-available/khilona /etc/nginx/sites-enabled/khilona
rm -f /etc/nginx/sites-enabled/default
# the parent of the uploads folder must be traversable by nginx
chmod 755 "$BASE" "$SHARED" "$SHARED/uploads"
nginx -t && systemctl reload nginx

log "Firewall"
SSH_PORT=$(echo "${SSH_CONNECTION:-}" | awk '{print $4}')
ufw allow OpenSSH >/dev/null
[ -n "$SSH_PORT" ] && [ "$SSH_PORT" != "22" ] && ufw allow "$SSH_PORT/tcp" >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null
ufw status | sed -n '1,12p'

log "PM2 start-up on boot"
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$APP_USER" --hp "$BASE/home" >/dev/null
systemctl enable "pm2-$APP_USER" >/dev/null 2>&1 || true

log "HTTPS (Let's Encrypt)"
PUBLIC_IP=$(curl -fsS --max-time 10 https://api.ipify.org || curl -fsS --max-time 10 https://ifconfig.me || echo "")
missing=()
for host in "$DOMAIN" "www.$DOMAIN" "admin.$DOMAIN" "api.$DOMAIN"; do
  ip=$(getent ahostsv4 "$host" | awk 'NR==1 {print $1}')
  if [ -z "$ip" ] || { [ -n "$PUBLIC_IP" ] && [ "$ip" != "$PUBLIC_IP" ]; }; then missing+=("$host → ${ip:-no record}"); fi
done
if [ ${#missing[@]} -eq 0 ]; then
  if [ -n "$EMAIL" ]; then MAIL_ARGS=(-m "$EMAIL"); else MAIL_ARGS=(--register-unsafely-without-email); fi
  certbot --nginx -n --agree-tos "${MAIL_ARGS[@]}" --redirect \
    -d "$DOMAIN" -d "www.$DOMAIN" -d "admin.$DOMAIN" -d "api.$DOMAIN"
  echo "HTTPS enabled (auto-renewal is handled by certbot's timer)."
else
  warn "HTTPS not enabled yet. These DNS records must point to ${PUBLIC_IP:-this server}:"
  printf '   %s\n' "${missing[@]}"
  warn "Add A records for @, www, admin and api, wait a few minutes, then re-run this script."
fi

cp -f "$0" "$BASE/setup-server.sh" 2>/dev/null || true
log "Server ready. Next: deploy the code from your PC with deploy/push.sh"
