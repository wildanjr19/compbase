# Deployment CompBase ke VPS + Supabase Cloud (Step-by-Step)

Dokumen ini menjelaskan langkah deploy CompBase ke VPS pribadi menggunakan GitHub Actions sebagai CI/CD, dengan database di Supabase Cloud (supabase.com). Panduan dibuat untuk kondisi repo saat ini: monorepo `pnpm` dengan frontend Next.js di `frontend/` dan backend Node.js di `backend/`.

Tutorial ini memakai pendekatan berikut:

- GitHub Actions melakukan build check lebih dulu.
- Setelah lolos, workflow akan SSH ke VPS.
- VPS melakukan `git pull`, `pnpm install`, `pnpm build`, lalu restart service.
- Frontend dan backend dijalankan sebagai service `systemd`.
- Nginx dipakai sebagai reverse proxy.

Hasil akhir yang dituju:

- frontend live di domain publik (contoh: `https://compbase.domainkamu.com`)
- backend live di domain/subdomain publik (contoh: `https://api.compbase.domainkamu.com`)
- backend membaca/menulis data kompetisi ke Supabase Cloud
- setiap push ke branch deploy memicu deploy otomatis ke VPS

## 0. Jalur Eksekusi Paling Aman (Ikuti Urutan Ini)

Supaya tidak bolak-balik troubleshooting, jalankan dalam urutan berikut:

1. Siapkan project Supabase Cloud dan tabel `competitions`.
2. Siapkan VPS (Node.js, pnpm, Nginx, clone repo, `.env`).
3. Jalankan service systemd frontend + backend.
4. Verifikasi endpoint lokal VPS (`/health`, `/competitions`).
5. Konfigurasi Nginx + HTTPS.
6. Pasang GitHub Actions untuk deploy otomatis.

Kalau urutan ini diikuti, biasanya setup selesai dalam satu kali iterasi.

## 1. Setup Supabase Cloud (Wajib)

### 1.1 Buat Project Supabase

1. Buka `https://supabase.com` lalu login.
2. Klik `New project`.
3. Pilih organization, isi nama project, password database, region terdekat.
4. Tunggu sampai status project `Healthy`.

### 1.2 Buat Tabel competitions

Masuk ke `SQL Editor`, jalankan skrip ini:

```sql
create table if not exists public.competitions (
  id text primary key,
  name text not null,
  slug text not null,
  organizer text not null,
  category text not null,
  "regStart" date not null,
  "regEnd" date not null,
  "eventStart" date not null,
  "eventEnd" date not null,
  "isPriority" boolean not null default false,
  "hasGuidebook" boolean not null default false,
  description text not null,
  links jsonb not null default '{}'::jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists competitions_regend_idx on public.competitions ("regEnd");

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists competitions_set_updated_at on public.competitions;

create trigger competitions_set_updated_at
before update on public.competitions
for each row
execute function public.set_updated_at();
```

### 1.3 Ambil Credential API Supabase

1. Buka `Project Settings -> API`.
2. Salin:
   - `Project URL` -> untuk `SUPABASE_URL`
   - `service_role key` -> untuk `SUPABASE_SERVICE_ROLE_KEY`

Penting:

- `service_role key` hanya untuk backend/server.
- jangan taruh `service_role key` di client/browser.

### 1.4 Verifikasi Supabase Siap Dipakai

Di SQL Editor, jalankan:

```sql
select count(*) from public.competitions;
```

Kalau query sukses, lanjut ke setup VPS.

## 2. Gambaran Arsitektur Deploy

Contoh arsitektur production:

```text
Pengunjung
   |
   v
Nginx :80 / :443
   |----------------------> frontend (Next.js) :3000
   |
   |----------------------> backend API :4000
```

Contoh domain:

- `compbase.domainkamu.com` -> frontend
- `api.compbase.domainkamu.com` -> backend

Kalau ingin lebih sederhana, kamu juga bisa memakai satu domain dan mem-proxy backend ke path seperti `/api-internal`, tetapi untuk proyek ini domain terpisah biasanya lebih mudah dikelola.

## 3. Prasyarat

Sebelum mulai, siapkan:

- VPS Linux berbasis Ubuntu 22.04 atau 24.04
- akses user dengan hak `sudo`
- repository CompBase di GitHub
- domain atau subdomain yang mengarah ke IP VPS
- SSH key untuk akses dari GitHub Actions ke VPS

Disarankan spesifikasi minimum:

- 1 vCPU
- 1 GB RAM
- 20 GB storage

Kalau traffic masih kecil, spesifikasi itu cukup untuk tahap awal.

## 4. Struktur yang Akan Dipakai di VPS

Contoh struktur direktori:

```text
/var/www/compbase
|- .git
|- frontend/
|- backend/
|- package.json
|- pnpm-lock.yaml
```

Contoh port runtime:

- frontend: `3000`
- backend: `4000`

## 5. Siapkan VPS

Masuk ke VPS:

```bash
ssh deploy@IP_VPS
```

Update paket sistem:

```bash
sudo apt update && sudo apt upgrade -y
```

Install utilitas dasar:

```bash
sudo apt install -y curl git unzip nginx
```

## 6. Install Node.js dan pnpm

Gunakan Node.js LTS yang kompatibel dengan Next.js 16.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Aktifkan `corepack` lalu siapkan `pnpm`:

```bash
sudo corepack enable
corepack prepare pnpm@10.32.1 --activate
pnpm -v
```

Catatan:

- Versi `pnpm` sebaiknya disamakan dengan yang ada di `package.json`.
- Jika `corepack prepare` gagal, jalankan ulang sebagai user deploy biasa, bukan root.

## 7. Buat User Deploy Khusus

Kalau belum punya user khusus deploy:

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
```

Setelah itu login ulang sebagai `deploy`.

## 8. Buat SSH Key untuk GitHub Actions

Di komputer lokalmu, buat key khusus deploy:

```bash
ssh-keygen -t ed25519 -C "github-actions-compbase" -f github-actions-compbase
```

Hasilnya:

- private key: `github-actions-compbase`
- public key: `github-actions-compbase.pub`

Tambahkan public key ke VPS:

```bash
mkdir -p ~/.ssh
cat github-actions-compbase.pub >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

Nanti private key akan disimpan sebagai GitHub Secret.

## 9. Clone Repository di VPS

Masih di VPS, clone project ke direktori target:

```bash
sudo mkdir -p /var/www/compbase
sudo chown -R deploy:deploy /var/www/compbase
git clone git@github.com:USERNAME/REPO.git /var/www/compbase
cd /var/www/compbase
pnpm install
pnpm build
```

Kalau repo masih private dan VPS perlu akses SSH ke GitHub, pastikan VPS juga memiliki deploy key atau gunakan clone via HTTPS dengan token.

## 10. Siapkan File Environment

Di server, buat file environment untuk runtime root project.

```bash
cd /var/www/compbase
cp .env.example .env
nano .env
```

Contoh isi `.env` di VPS:

```env
BACKEND_PORT=4000
BACKEND_BASE_URL=http://127.0.0.1:4000
SUPABASE_URL=https://PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=isi-service-role-key
SUPABASE_COMPETITIONS_TABLE=competitions
BACKEND_ADMIN_TOKEN=ganti-dengan-token-random-panjang
PORT=3000
NODE_ENV=production
ADMIN_EMAIL=admin@compbase.id
ADMIN_PASSWORD=ganti-dengan-password-yang-kuat
```

Penjelasan:

- `BACKEND_PORT=4000` dipakai backend.
- `BACKEND_BASE_URL=http://127.0.0.1:4000` aman untuk frontend yang berjalan di server yang sama.
- `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` dipakai backend untuk konek ke Supabase Cloud.
- `SUPABASE_SERVICE_ROLE_KEY` wajib disimpan aman di server dan GitHub Secrets, jangan ditaruh di client/browser.
- `BACKEND_ADMIN_TOKEN` dipakai untuk mengunci endpoint write backend. Jika nilainya diisi, mutasi `POST/PUT/DELETE` wajib mengirim header `x-compbase-admin-token`.
- `PORT=3000` dipakai Next.js saat `next start`.
- `ADMIN_EMAIL` dan `ADMIN_PASSWORD` dipakai untuk login panel admin.

Setelah disimpan, amankan permission file:

```bash
chmod 600 .env
```

Kalau frontend perlu memanggil backend lewat domain publik, kamu bisa ganti `BACKEND_BASE_URL` ke:

```env
BACKEND_BASE_URL=https://api.compbase.domainkamu.com
```

Namun untuk satu VPS yang sama, alamat internal `127.0.0.1` biasanya lebih efisien.

## 11. Buat Service systemd untuk Backend

Buat file service:

```bash
sudo nano /etc/systemd/system/compbase-backend.service
```

Isi file:

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

## 12. Buat Service systemd untuk Frontend

Buat file service:

```bash
sudo nano /etc/systemd/system/compbase-frontend.service
```

Isi file:

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

Aktifkan kedua service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable compbase-backend
sudo systemctl enable compbase-frontend
sudo systemctl start compbase-backend
sudo systemctl start compbase-frontend
```

Cek status:

```bash
sudo systemctl status compbase-backend
sudo systemctl status compbase-frontend
```

Lihat log jika ada masalah:

```bash
journalctl -u compbase-backend -n 100 --no-pager
journalctl -u compbase-frontend -n 100 --no-pager
```

## 13. Konfigurasi Nginx

### Frontend domain utama

Buat file:

```bash
sudo nano /etc/nginx/sites-available/compbase-frontend
```

Isi contoh:

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

### Backend subdomain

Buat file:

```bash
sudo nano /etc/nginx/sites-available/compbase-backend
```

Isi contoh:

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

Aktifkan konfigurasi:

```bash
sudo ln -s /etc/nginx/sites-available/compbase-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/compbase-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 14. Pasang HTTPS dengan Certbot

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Jalankan untuk frontend:

```bash
sudo certbot --nginx -d compbase.domainkamu.com
```

Jalankan untuk backend:

```bash
sudo certbot --nginx -d api.compbase.domainkamu.com
```

Tes auto-renew:

```bash
sudo certbot renew --dry-run
```

## 15. Siapkan GitHub Secrets

Di repository GitHub, buka:

`Settings -> Secrets and variables -> Actions`

Tambahkan secret berikut:

- `VPS_HOST`
  Contoh: `123.123.123.123`

- `VPS_PORT`
  Contoh: `22`

- `VPS_USER`
  Contoh: `deploy`

- `VPS_SSH_KEY`
  Isi dengan private key dari `github-actions-compbase`

- `VPS_APP_DIR`
  Contoh: `/var/www/compbase`

- `DEPLOY_BRANCH`
  Contoh: `main`

- `.env` yang berisi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` tetap disimpan di VPS (bukan di repo).

- Pastikan file `.env` di VPS juga berisi `ADMIN_EMAIL` dan `ADMIN_PASSWORD` yang benar.

## 16. Buat Workflow GitHub Actions

Buat file:

```text
.github/workflows/deploy.yml
```

Isi contoh workflow:

```yaml
name: Deploy CompBase

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.32.1

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependency
        run: pnpm install --frozen-lockfile

      - name: Build backend
        run: pnpm --filter backend build

      - name: Build frontend
        run: pnpm --filter frontend build

      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.VPS_SSH_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -p ${{ secrets.VPS_PORT }} ${{ secrets.VPS_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy to VPS
        run: |
          DEPLOY_BRANCH="${{ secrets.DEPLOY_BRANCH }}"
          if [ -z "$DEPLOY_BRANCH" ]; then DEPLOY_BRANCH="main"; fi

          ssh -p ${{ secrets.VPS_PORT }} ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} << EOF
            set -e
            cd ${{ secrets.VPS_APP_DIR }}
            git fetch origin
            git checkout "$DEPLOY_BRANCH"
            git pull origin "$DEPLOY_BRANCH"
            pnpm install --frozen-lockfile
            pnpm --filter backend build
            pnpm --filter frontend build
            sudo systemctl restart compbase-backend
            sudo systemctl restart compbase-frontend
          EOF
```

Catatan penting:

- Workflow default pakai `main`, tetapi bisa dioverride lewat secret `DEPLOY_BRANCH`.
- `sudo systemctl restart ...` harus bisa dijalankan oleh user deploy.
- Jika `sudo` meminta password, tambahkan rule `sudoers` khusus untuk restart service.

## 17. Izinkan Restart Service Tanpa Password

Jalankan:

```bash
sudo visudo
```

Tambahkan baris ini:

```text
deploy ALL=NOPASSWD: /bin/systemctl restart compbase-backend, /bin/systemctl restart compbase-frontend
```

Kalau di server path `systemctl` berbeda, cek dulu:

```bash
which systemctl
```

## 18. Uji Deploy Pertama

Lakukan satu commit kecil lalu push ke branch deploy:

```bash
git add .
git commit -m "docs(deploy): tambah panduan deployment awal"
git push origin main
```

Setelah itu cek:

- tab `Actions` di GitHub
- status workflow apakah sukses
- domain frontend apakah terbuka
- endpoint backend `https://api.compbase.domainkamu.com/health`

## 19. Checklist Verifikasi Setelah Deploy

- halaman utama frontend terbuka normal
- spotlight dan katalog kompetisi muncul
- filter dan pencarian tetap bekerja
- admin panel bisa dibuka
- endpoint `/health` merespons `ok: true`
- endpoint `/competitions` mengembalikan data
- log `systemd` bersih dari error berulang
- login admin di `/admin` berhasil dan redirect ke `/admin/panel`

## 20. Rollback Sederhana

Kalau deploy terbaru bermasalah, rollback paling cepat:

```bash
cd /var/www/compbase
git log --oneline -5
git checkout HASH_COMMIT_SEBELUMNYA
pnpm install --frozen-lockfile
pnpm --filter backend build
pnpm --filter frontend build
sudo systemctl restart compbase-backend
sudo systemctl restart compbase-frontend
```

Kalau ingin rollback yang lebih rapi dalam jangka panjang, buat strategi release berbasis tag atau direktori release terpisah.

## 21. Troubleshooting Umum

### Frontend jalan, tapi data katalog kosong

Periksa:

- apakah backend service aktif
- apakah `BACKEND_BASE_URL` mengarah ke alamat yang benar
- apakah `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` backend sudah benar
- apakah tabel `competitions` di Supabase berisi data

Cek:

```bash
curl http://127.0.0.1:4000/health
curl http://127.0.0.1:4000/competitions
```

### GitHub Actions gagal SSH ke VPS

Periksa:

- `VPS_HOST`, `VPS_PORT`, `VPS_USER` benar
- private key di `VPS_SSH_KEY` lengkap
- public key sudah masuk ke `~/.ssh/authorized_keys`
- permission file `.ssh` sudah benar

### `pnpm` tidak ditemukan saat service berjalan

Cari lokasi binarinya:

```bash
which pnpm
```

Lalu ganti `ExecStart=` di file `systemd` sesuai path yang benar.

### Nginx memberi `502 Bad Gateway`

Biasanya berarti:

- service frontend/backend belum jalan
- port di Nginx tidak sama dengan port aplikasi
- service crash setelah start

Cek:

```bash
sudo systemctl status compbase-frontend
sudo systemctl status compbase-backend
journalctl -u compbase-frontend -n 100 --no-pager
journalctl -u compbase-backend -n 100 --no-pager
```

## 22. Rekomendasi Lanjutan

Setelah deploy dasar berhasil, langkah yang layak dipertimbangkan:

- tambah branch khusus production selain `main`
- tambahkan job test/lint terpisah di GitHub Actions
- pisahkan environment staging dan production
- simpan secret sensitif di `.env` server, bukan di repo
- tambahkan mekanisme health check sebelum restart service
- pertimbangkan release berbasis tag untuk rollback yang lebih aman

## 23. Ringkasan Singkat Alur Deploy

1. Developer push ke GitHub.
2. GitHub Actions menjalankan install dan build.
3. Jika build sukses, workflow SSH ke VPS.
4. VPS menarik commit terbaru.
5. VPS install dependency dan build ulang.
6. VPS restart service frontend dan backend.
7. Nginx tetap menjadi pintu masuk traffic publik.

Dengan pola ini, kamu sudah punya alur deploy yang cukup rapi, murah, dan cocok untuk VPS pribadi tanpa perlu platform container yang lebih kompleks.
