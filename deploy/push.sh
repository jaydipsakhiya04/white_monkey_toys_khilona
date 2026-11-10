#!/usr/bin/env bash
# Deploy from this PC (Git Bash / macOS / Linux) to the server over SSH.
#
#   deploy/push.sh <user@server-ip> [options]
#
# Options:
#   --setup <domain> [email]  first time: upload + run setup-server.sh (Node, PostgreSQL, Nginx, HTTPS…)
#   --data                    also copy the local catalogue (store settings, categories, products,
#                             photos, banners) into the server database (existing rows are kept)
#   --data-replace            like --data but empties the server's store/banners/catalogue first
#                             (only before the site has orders)
#   --port <n>                SSH port (default 22)
#   --key <path>              SSH private key (default: ssh's own defaults)
#
# Only the LAST COMMIT is deployed (git archive HEAD): commit your changes first.
set -euo pipefail

TARGET="${1:-}"
[ -n "$TARGET" ] && [ "${TARGET#-}" = "$TARGET" ] || { sed -n '2,17p' "$0"; exit 1; }
shift
PORT=22; KEY=""; DATA=""; SETUP_DOMAIN=""; SETUP_EMAIL=""
while [ $# -gt 0 ]; do
  case "$1" in
    --port) PORT="$2"; shift 2 ;;
    --key) KEY="$2"; shift 2 ;;
    --data) DATA="keep"; shift ;;
    --data-replace) DATA="replace"; shift ;;
    --setup)
      SETUP_DOMAIN="$2"; shift 2
      if [ $# -gt 0 ] && [ "${1#-}" = "$1" ]; then SETUP_EMAIL="$1"; shift; fi ;;
    *) echo "Unknown option $1"; exit 1 ;;
  esac
done

SSH_OPTS=(-p "$PORT" -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30)
SCP_OPTS=(-P "$PORT" -o StrictHostKeyChecking=accept-new)
if [ -n "$KEY" ]; then SSH_OPTS+=(-i "$KEY"); SCP_OPTS+=(-i "$KEY"); fi
remote() { ssh "${SSH_OPTS[@]}" "$TARGET" "$@"; }
# run a script as root on the server, sent over stdin (sudo is used when logged in as a normal
# user — that user needs passwordless sudo; logging in as root is simplest)
remote_root() { printf '%s\n' "$1" | remote 'if [ "$(id -u)" = 0 ]; then bash -s; else sudo -n bash -s; fi'; }

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
if [ -n "$(git status --porcelain)" ]; then
  echo "!! You have uncommitted changes — they are NOT deployed (only the last commit is)."
fi
SHA=$(git rev-parse --short HEAD)
RELEASE="$(date +%Y%m%d-%H%M%S)-$SHA"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "==> Checking SSH access to $TARGET"
remote "echo connected to \$(hostname) — \$(. /etc/os-release && echo \$PRETTY_NAME)"

if [ -n "$SETUP_DOMAIN" ]; then
  echo "==> Server setup for $SETUP_DOMAIN"
  scp "${SCP_OPTS[@]}" deploy/setup-server.sh "$TARGET:/tmp/khilona-setup-server.sh"
  remote_root "sed -i 's/\r\$//' /tmp/khilona-setup-server.sh && bash /tmp/khilona-setup-server.sh '$SETUP_DOMAIN' '$SETUP_EMAIL'"
fi

echo "==> Packing commit $SHA"
git archive --format=tar.gz -o "$TMP/release.tgz" HEAD
UPLOADS=("$TMP/release.tgz" deploy/remote-deploy.sh)

DATA_ARGS=""
if [ -n "$DATA" ]; then
  echo "==> Exporting local catalogue data"
  (cd khilona_backend && npx tsx prisma/transfer-export.ts "$TMP/khilona-data.json")
  tar -czf "$TMP/khilona-uploads.tgz" -C khilona_backend/uploads .
  UPLOADS+=("$TMP/khilona-data.json" "$TMP/khilona-uploads.tgz")
  DATA_ARGS="--data /tmp/khilona-data.json /tmp/khilona-uploads.tgz"
  [ "$DATA" = "replace" ] && DATA_ARGS="$DATA_ARGS --replace"
fi

echo "==> Uploading"
scp "${SCP_OPTS[@]}" "${UPLOADS[@]}" "$TARGET:/tmp/"

echo "==> Building and starting release $RELEASE on the server (takes a few minutes)"
remote_root "set -e
  mkdir -p /opt/khilona/releases/$RELEASE
  tar -xzf /tmp/release.tgz -C /opt/khilona/releases/$RELEASE
  sed -i 's/\r\$//' /tmp/remote-deploy.sh
  bash /tmp/remote-deploy.sh $RELEASE $DATA_ARGS
  rm -f /tmp/release.tgz /tmp/khilona-data.json /tmp/khilona-uploads.tgz"
echo "==> Done"
