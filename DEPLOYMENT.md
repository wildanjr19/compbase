# Deployment CompBase ke VPS + Supabase Cloud

Panduan ini mengikuti kondisi repo saat ini:

- monorepo `pnpm`
- frontend Next.js di `frontend/`
- backend Node.js di `backend/`
- backend bisa membaca data dari `Supabase Cloud` atau fallback ke file lokal JSON
- schema database dikelola lewat `Supabase CLI`
- autentikasi admin memakai signed session cookie + hash password scrypt
- backend sudah memiliki rate limiting untuk endpoint submit publik dan write admin

## 1. Ringkasan Alur

1. Siapkan project Supabase.
2. Link repo ini ke project Supabase lewat CLI.
3. Jalankan migration schema lewat CLI.
4. Siapkan VPS dan `.env` production.
5. Jalankan backend dan frontend sebagai service.
6. Jika ada data lokal lama, migrasikan ke Supabase.
7. Deploy artefak build dari GitHub Actions ke VPS.

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
supabase/migrations/20260427131000_make_competition_dates_nullable.sql
supabase/migrations/20260427210000_create_competition_submissions.sql
supabase/migrations/20260429181423_create_admin_audit_logs.sql
supabase/migrations/20260429193000_fix_admin_audit_logs_rls_policies.sql
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
SUPABASE_SUBMISSIONS_TABLE=competition_submissions
LOCAL_COMPETITIONS_FILE_PATH=backend/.local/competitions.json
LOCAL_SUBMISSIONS_FILE_PATH=backend/.local/submissions.json
BACKEND_ADMIN_TOKEN=ganti-dengan-token-random-panjang
BACKEND_TRUST_PROXY=true
PORT=3000
NODE_ENV=production
ADMIN_EMAIL=admin@compbase.id
ADMIN_PASSWORD_HASH=isi-hash-scrypt-password-admin
ADMIN_SESSION_SECRET=isi-random-string-min-32-karakter
```

Catatan:

- jika `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` diisi, backend otomatis memakai Supabase
- jika keduanya kosong, backend otomatis fallback ke file lokal
- `LOCAL_COMPETITIONS_FILE_PATH` dipakai sebagai sumber migrasi data lama
- `BACKEND_TRUST_PROXY=true` hanya jika backend berada di balik reverse proxy tepercaya
- `ADMIN_PASSWORD_HASH` wajib diisi; gunakan `pnpm admin:hash-password` untuk generate
- `ADMIN_SESSION_SECRET` wajib diisi di production untuk keamanan session cookie admin

### 3.1 Generate hash password + session secret (wajib)

Generate secret acak untuk `ADMIN_SESSION_SECRET`:

```bash
openssl rand -base64 48
```

Generate hash password admin untuk `ADMIN_PASSWORD_HASH`:

```bash
pnpm admin:hash-password "PASSWORD_ADMIN_KAMU"
```

Copy output hash ke `.env` sebagai nilai `ADMIN_PASSWORD_HASH`.

## 4. Siapkan VPS

Asumsi:

- OS: Ubuntu 24.04
- user deploy: `username`
- direktori app: `/opt/compbase`

Install dependency dasar:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx rsync
```

Install Node.js 22 dan pnpm:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
corepack prepare pnpm@10.32.1 --activate
```

Siapkan direktori aplikasi:

```bash
sudo mkdir -p /var/www/compbase
sudo chown -R deploy:deploy /var/www/compbase
```

Catatan:

- dengan workflow deploy yang sekarang, VPS tidak perlu build ulang
- repo tidak wajib di-`git clone` di VPS untuk alur deploy harian
- GitHub Actions akan mengirim bundle hasil build + `node_modules` ke VPS

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
5. buat bundle deploy di GitHub Actions
6. upload bundle ke VPS
7. extract bundle ke direktori sementara di VPS
8. `rsync` hasilnya ke direktori aplikasi
9. restart backend dan frontend
10. health check backend lokal VPS

Bundle deploy saat ini mencakup source repo yang dibutuhkan runtime, hasil build, dan `node_modules`, sambil tetap mengecualikan:

- `.git`
- `.github`
- `backend/.local`
- `frontend/.next/cache`

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
- migration `20260429193000_fix_admin_audit_logs_rls_policies.sql` sudah ikut ter-push
- `.env` di VPS terisi benar
- `rsync` tersedia di VPS
- backend sehat di `/health`
- frontend bisa dibuka
- jika ada data lama, migrasi data lokal sudah dijalankan

## 13. Troubleshooting Singkat

### Backend masih membaca local

Periksa:

- `SUPABASE_URL` terisi
- `SUPABASE_SERVICE_ROLE_KEY` terisi
- service backend sudah direstart

### Login admin gagal setelah deploy

Periksa:

- `ADMIN_PASSWORD_HASH` valid (format `scrypt$<salt>$<hash>`)
- `ADMIN_SESSION_SECRET` terisi string acak panjang
- waktu server sinkron (NTP aktif) agar TTL session konsisten

### `db push` gagal

Periksa:

- project sudah di-`link`
- file migration ada di folder `supabase/migrations`
- credential Supabase CLI valid

### GitHub Actions gagal deploy

Periksa:

- SSH secret benar
- `VPS_APP_DIR` benar
- `rsync` tersedia di VPS
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
