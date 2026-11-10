# Deploying White Monkey Toys

Everything runs on **one Linux server** (Ubuntu 22.04 / 24.04 or Debian 12, at least 2 GB RAM
recommended, 1 GB works with the swap the setup adds):

| Address | What | Runs on the server as |
|---|---|---|
| `https://<domain>` (and `www.` → redirects) | Storefront | Next.js on 127.0.0.1:3000 |
| `https://admin.<domain>` | Admin panel | Next.js on 127.0.0.1:3001 |
| `https://api.<domain>` | API + product photos (`/uploads`) | NestJS on :4000, photos served by Nginx |

PostgreSQL (UTF-8), Nginx, free HTTPS certificates (Let's Encrypt, auto-renewing), PM2 (keeps the
three apps running and restarts them after a reboot) and a firewall (only SSH, HTTP, HTTPS open)
are installed by the setup script.

## Files in this folder

| File | Where it runs | What it does |
|---|---|---|
| `setup-server.sh` | server, once (safe to re-run) | Installs everything, creates the database + secrets, Nginx sites, firewall, HTTPS |
| `push.sh` | your PC (Git Bash) | Packs the last commit, uploads it, builds and starts it on the server; `--data` also copies the catalogue |
| `remote-deploy.sh` | server (called by push.sh) | Install → build → migrate database → switch release → reload → health check |
| `ecosystem.config.cjs` | server | PM2 process list (api, store, admin) |

Server layout: `/opt/khilona/releases/<date>-<commit>` (last 3 kept), `/opt/khilona/current` →
live release, `/opt/khilona/shared/env/*.env` (secrets, never in git), `/opt/khilona/shared/uploads`
(photos uploaded in the admin panel — kept across deploys), `/opt/khilona/shared/logs`.

---

## 1. What you do (once)

1. **Server login.** Add this public key to the server so deployments can log in (no password needed):

   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHoC8DTIe8Q0ZG+ecOpL1vQvXu7U8LH0nbIAINiOJ3B1 khilona-deploy@DESKTOP-PFL38T6
   ```

   - Hosting panel: look for **SSH keys** (DigitalOcean, Hostinger VPS, Vultr, AWS "Key pairs", …) and
     paste it, **or**
   - log in once yourself and run:
     `mkdir -p ~/.ssh && echo "<the key above>" >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`

   Log in as **root** (simplest) or as a user with passwordless `sudo`.

2. **DNS.** At your domain provider (GoDaddy, Hostinger, Namecheap, Cloudflare, …) add four
   **A records** pointing to the server's IP address:

   | Type | Name / Host | Value |
   |---|---|---|
   | A | `@` | server IP |
   | A | `www` | server IP |
   | A | `admin` | server IP |
   | A | `api` | server IP |

   (On Cloudflare, set them to **DNS only** (grey cloud) until HTTPS is issued.) Changes usually
   take 5–30 minutes.

3. **Tell me:** the server IP, the SSH user (e.g. `root`) and port if not 22, the domain, an
   email for the HTTPS certificate notices, and the email you want for the admin-panel login.

## 2. What I run from this PC

```bash
# a) first time: set up the server + deploy the code + copy the catalogue (store settings,
#    categories, 111 products, photos, banners)
deploy/push.sh root@SERVER_IP --key ~/.ssh/khilona_deploy --setup yourdomain.com you@email.com --data

# b) create the owner's admin login (prints a strong password once)
ssh -i ~/.ssh/khilona_deploy root@SERVER_IP \
  "cd /opt/khilona/current/khilona_backend && sudo -u khilona npx tsx prisma/create-admin.ts --email owner@email.com --name 'Owner'"

# c) if DNS was not ready during (a): enable HTTPS once the records resolve
ssh -i ~/.ssh/khilona_deploy root@SERVER_IP "bash /opt/khilona/setup-server.sh yourdomain.com you@email.com"
```

Then I check https://yourdomain.com, https://admin.yourdomain.com and
https://api.yourdomain.com/api/health, log in to the admin panel and place a test order.

## 3. After go-live (you, in the admin panel)

- Log in at `https://admin.<domain>` with the owner email + the printed password, then change the
  password under **Profile**.
- **Store**: check both mobile numbers, address and timings; "Prices on the storefront" stays **off**
  until you want prices shown.
- **Banners**: the generated banners are copied; delete the three stock-template test uploads at the
  end of the list (one has a Shutterstock watermark).
- **Products**: stock was a placeholder (10 per item) — set real stock.
- The local test logins (`admin@khilona.in` / `Admin@12345`, …) are **not** copied to the server.

## Updating the site later

Commit your changes, then:

```bash
deploy/push.sh root@SERVER_IP --key ~/.ssh/khilona_deploy
```

Builds the new version next to the running one, applies database migrations, then switches over
(the previous 2 releases stay on disk). Do **not** use `--data` again unless you want to copy local
catalogue rows to the server (existing rows are kept; `--data-replace` empties the server's
catalogue first and is only for before the first real order).

## Useful commands on the server

```bash
sudo -u khilona pm2 status                    # are the 3 apps running?
sudo -u khilona pm2 logs --lines 100          # live logs (Ctrl+C to exit)
sudo -u khilona pm2 restart all               # restart everything
sudo nano /opt/khilona/shared/env/backend.env # API settings (restart after editing)
sudo -u postgres pg_dump -Fc khilona > /root/khilona-$(date +%F).dump   # database backup
sudo certbot renew --dry-run                  # check certificate auto-renewal
```

Roll back to the previous release:

```bash
cd /opt/khilona/releases && ls -t          # pick the previous folder
sudo ln -sfn /opt/khilona/releases/<previous> /opt/khilona/current && sudo -u khilona pm2 reload all
```

## If the hosting is cPanel / shared hosting

This project needs a Node.js server and PostgreSQL that run all the time, which shared hosting
usually cannot provide. Use a small VPS instead (2 GB RAM, Ubuntu 24.04 — e.g. Hostinger KVM 2,
DigitalOcean, Contabo) and keep the domain where it is: only the DNS records above change.
