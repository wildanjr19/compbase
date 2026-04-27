# Deployment CompBase ke VPS + Supabase Cloud

Panduan ini mengikuti kondisi repo saat ini:

- monorepo `pnpm`
- frontend Next.js di `frontend/`
- backend Node.js di `backend/`
- backend bisa membaca data dari `Supabase Cloud` atau fallback ke file lokal JSON
- schema database dikelola lewat `Supabase CLI`

## 1. Ringkasan Alur

1. Siapkan project Supabase.
2. Link repo ini ke project Supabase lewat CLI.
3. Jalankan migration schema lewat CLI.
4. Siapkan VPS dan `.env` production.
5. Jalankan backend dan frontend sebagai service.
6. Jika ada data lokal lama, migrasikan ke Supabase.
7. Aktifkan GitHub Actions deploy.

## 2. Migration Schema via Supabase CLI

### 2.1 Install dan login Supabase CLI

Di mesin lokal:

```bash
pnpm dlx supabase@latest login
```

### 2.2 Link repo ke project Supabase

Ambil `project ref` dari dashboard Supabase, lalu jalankan:

```bash
pnpm dlx supabase@latest link --project-ref PROJECT_REF
```

Repo ini sudah menyiapkan file migration schema di:

```text
supabase/migrations/20260427120000_create_competitions.sql
```

### 2.3 Push migration ke Supabase Cloud

```bash
pnpm dlx supabase@latest db push
```

### 2.4 Verifikasi migration via CLI

```bash
pnpm dlx supabase@latest migration list
```

Kalau ingin cek isi tabel dari dashboard sesudahnya, itu opsional. Alur migration schema utama tetap lewat CLI.

## 3. Environment Production

Contoh `.env` di VPS:

```env
BACKEND_PORT=4000
BACKEND_BASE_URL=http://127.0.0.1:4000
SUPABASE_URL=https://PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=isi-service-role-key
SUPABASE_COMPETITIONS_TABLE=competitions
LOCAL_COMPETITIONS_FILE_PATH=backend/.local/competitions.json
BACKEND_ADMIN_TOKEN=ganti-dengan-token-random-panjang
PORT=3000
NODE_ENV=production
ADMIN_EMAIL=admin@compbase.id
ADMIN_PASSWORD=ganti-dengan-password-yang-kuat
```

Catatan:

- jika `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` diisi, backend otomatis memakai Supabase
- jika keduanya kosong, backend otomatis fallback ke file lokal
- `LOCAL_COMPETITIONS_FILE_PATH` dipakai sebagai sumber migrasi data lama

## 4. Siapkan VPS

Asumsi:

- OS: Ubuntu 22.04 atau 24.04
- user deploy: `deploy`
- direktori app: `/var/www/compbase`

Install dependency dasar:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx
```

Install Node.js 22 dan pnpm:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
corepack prepare pnpm@10.32.1 --activate
```

Clone repo:

```bash
sudo mkdir -p /var/www/compbase
sudo chown -R deploy:deploy /var/www/compbase
git clone git@github.com:USERNAME/REPO.git /var/www/compbase
cd /var/www/compbase
pnpm install --frozen-lockfile
pnpm --filter backend build
pnpm --filter frontend build
```

## 5. Service systemd

### Backend

File `/etc/systemd/system/compbase-backend.service`

```ini
[Unit]
Description=CompBase Backend
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/compbase
EnvironmentFile=/var/www/compbase/.env
ExecStart=/usr/bin/pnpm --filter backend start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Frontend

File `/etc/systemd/system/compbase-frontend.service`

```ini
[Unit]
Description=CompBase Frontend
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/compbase
EnvironmentFile=/var/www/compbase/.env
ExecStart=/usr/bin/pnpm --filter frontend start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Aktifkan:

```bash
sudo systemctl daemon-reload
sudo systemctl enable compbase-backend
sudo systemctl enable compbase-frontend
sudo systemctl start compbase-backend
sudo systemctl start compbase-frontend
```

Verifikasi:

```bash
sudo systemctl status compbase-backend
sudo systemctl status compbase-frontend
curl http://127.0.0.1:4000/health
```

Jika backend sudah membaca Supabase, respons `/health` akan menampilkan `dataSource: "supabase"`.

## 6. Nginx

### Frontend

```nginx
server {
    listen 80;
    server_name compbase.domainkamu.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Backend

```nginx
server {
    listen 80;
    server_name api.compbase.domainkamu.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifkan lalu reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d compbase.domainkamu.com
sudo certbot --nginx -d api.compbase.domainkamu.com
sudo certbot renew --dry-run
```

## 8. Migrasi Data Lokal ke Supabase

Bagian ini khusus untuk isi data, bukan schema database.

Jika kamu sudah punya file lokal seperti:

```text
backend/.local/competitions.json
```

isi env berikut dulu:

```env
SUPABASE_URL=https://PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=isi-service-role-key
SUPABASE_COMPETITIONS_TABLE=competitions
LOCAL_COMPETITIONS_FILE_PATH=backend/.local/competitions.json
```

Lalu jalankan:

```bash
pnpm --filter backend migrate:supabase
```

Script ini akan:

- membaca file lokal JSON
- memvalidasi format data
- melakukan `upsert` ke Supabase berdasarkan `id`

Setelah selesai:

```bash
sudo systemctl restart compbase-backend
curl http://127.0.0.1:4000/health
```

Pastikan `dataSource` berubah menjadi `supabase`.

## 9. GitHub Actions Secrets

Tambahkan secret berikut di GitHub:

- `VPS_HOST`
- `VPS_PORT`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_APP_DIR`
- `DEPLOY_BRANCH`

Contoh:

- `VPS_PORT=22`
- `VPS_APP_DIR=/var/www/compbase`
- `DEPLOY_BRANCH=main`

## 10. Workflow Deploy

File aktif:

```text
.github/workflows/deploy.yml
```

Alur workflow sekarang:

1. checkout repo
2. install dependency
3. build backend
4. build frontend
5. SSH ke VPS
6. `git fetch origin`
7. checkout branch deploy langsung dari `origin/<branch>`
8. install dan build ulang di VPS
9. restart backend dan frontend
10. health check backend lokal VPS

## 11. Izin Restart Service

Tambahkan ke `visudo`:

```text
deploy ALL=NOPASSWD: /bin/systemctl restart compbase-backend, /bin/systemctl restart compbase-frontend
```

Cek path `systemctl` jika perlu:

```bash
which systemctl
```

## 12. Checklist Deploy

- `pnpm --filter backend build` sukses
- `pnpm --filter frontend build` sukses
- `pnpm dlx supabase@latest db push` sudah dijalankan
- `.env` di VPS terisi benar
- backend sehat di `/health`
- frontend bisa dibuka
- jika ada data lama, migrasi data lokal sudah dijalankan

## 13. Troubleshooting Singkat

### Backend masih membaca local

Periksa:

- `SUPABASE_URL` terisi
- `SUPABASE_SERVICE_ROLE_KEY` terisi
- service backend sudah direstart

### `db push` gagal

Periksa:

- project sudah di-`link`
- file migration ada di folder `supabase/migrations`
- credential Supabase CLI valid

### GitHub Actions gagal deploy

Periksa:

- SSH secret benar
- branch deploy benar
- user deploy bisa restart service

## 14. Perintah Penting

```bash
pnpm dlx supabase@latest link --project-ref PROJECT_REF
pnpm dlx supabase@latest db push
pnpm dlx supabase@latest migration list
pnpm --filter backend migrate:supabase
curl http://127.0.0.1:4000/health
journalctl -u compbase-backend -n 100 --no-pager
journalctl -u compbase-frontend -n 100 --no-pager
```
