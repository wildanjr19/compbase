# CompBase

CompBase adalah platform katalog kompetisi statistik, data science, hackathon, datathon, dan lomba analitik lain dalam satu workspace monorepo. Proyek ini memisahkan aplikasi publik berbasis Next.js dan layanan backend Node.js sederhana agar pengembangan frontend, admin panel, dan integrasi data bisa berkembang bertahap dengan alur yang lebih rapi.

## Gambaran Singkat

- Katalog kompetisi publik dengan spotlight, pencarian, filter, dan pengurutan.
- Panel admin untuk meninjau dan mengelola data kompetisi.
- Backend API sebagai gateway ke database Supabase Cloud.
- Struktur monorepo `pnpm` agar frontend dan backend bisa dijalankan bersama.

## Fitur Saat Ini

- Landing page publik dengan hero section dan spotlight kompetisi prioritas.
- Filter berbasis query URL: tab cepat, pencarian, kategori, dan urutan.
- Modal detail kompetisi dengan tautan penting.
- Pembatasan jumlah card di katalog awal dengan aksi `Tampilkan semua`.
- Login admin berbasis session cookie untuk membatasi akses ke panel.
- Panel admin `/admin/panel` untuk mengelola data kompetisi dengan validasi, duplikasi, reset draft, dan sinkronisasi create/update/delete ke backend.

## Arsitektur Repo

```text
compbase/
|- frontend/   -> aplikasi Next.js (App Router)
|- backend/    -> layanan API Node.js + TypeScript
|- PLAN.md     -> status phase pengembangan
|- DEPLOYMENT.md -> panduan deploy ke VPS dengan GitHub CI/CD
```

## Teknologi

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Backend: Node.js HTTP server, TypeScript, Supabase Cloud (Postgres)
- Workspace: pnpm

## Menjalankan Proyek Secara Lokal

### 1. Install dependency

```bash
pnpm install
```

### 2. Siapkan environment

Salin isi `.env.example` ke file environment yang sesuai kebutuhanmu.

Contoh minimal untuk local development:

```env
BACKEND_PORT=4000
BACKEND_BASE_URL=http://localhost:4000
SUPABASE_URL=https://PROJECT-REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=isi-service-role-key
SUPABASE_COMPETITIONS_TABLE=competitions
BACKEND_ADMIN_TOKEN=isi-token-opsional
ADMIN_EMAIL=admin@compbase.id
ADMIN_PASSWORD=ganti-password-admin
```

Alternatif untuk local-only tanpa Supabase:

```env
BACKEND_PORT=4000
BACKEND_BASE_URL=http://localhost:4000
BACKEND_ADMIN_TOKEN=isi-token-opsional
ADMIN_EMAIL=admin@compbase.id
ADMIN_PASSWORD=ganti-password-admin
LOCAL_COMPETITIONS_FILE_PATH=
```

Jika `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` tidak diisi, backend otomatis memakai penyimpanan lokal berbasis file JSON agar admin tetap bisa tambah/edit/hapus data saat development.

### 3. Jalankan seluruh service

```bash
pnpm dev
```

Perintah ini akan menjalankan:

- frontend di `http://localhost:3000`
- backend di `http://localhost:4000`

### 4. Jalankan per service jika diperlukan

```bash
pnpm dev:frontend
pnpm dev:backend
```

## Script Workspace

```bash
pnpm dev
pnpm dev:frontend
pnpm dev:backend
pnpm build
pnpm build:frontend
pnpm build:backend
pnpm start:frontend
pnpm start:backend
pnpm lint
```

Catatan:

- `pnpm lint` saat ini hanya mengarah ke frontend.
- Jika lint gagal karena masalah dependency lokal Next/ESLint, gunakan build sebagai verifikasi utama sementara.

## Environment Variables

### Root / shared runtime

- `BACKEND_PORT`
  Port HTTP backend. Default: `4000`.

- `BACKEND_BASE_URL`
  Base URL backend yang dipakai frontend saat mengambil data kompetisi.
  Untuk production di VPS, nilai ini bisa diarahkan ke domain publik backend atau alamat internal yang tetap bisa diakses dari frontend runtime.

- `BACKEND_ADMIN_TOKEN`
  Token opsional untuk mengunci endpoint write backend (`POST`, `PUT`, `DELETE`).
  Jika diisi, semua mutasi wajib mengirim header `x-compbase-admin-token` dengan nilai yang sama.

- `SUPABASE_URL`
  URL project Supabase Cloud dari dashboard `supabase.com`, misalnya `https://xxxx.supabase.co`.

- `SUPABASE_SERVICE_ROLE_KEY`
  Service role key Supabase Cloud untuk backend (server-side only, jangan pernah diekspos ke browser).

- `SUPABASE_COMPETITIONS_TABLE`
  Nama tabel kompetisi di Supabase. Default: `competitions`.

- `LOCAL_COMPETITIONS_FILE_PATH`
  Path file penyimpanan lokal JSON untuk development jika Supabase belum dikonfigurasi.
  Default: `.local/competitions.json` pada direktori kerja backend.

- `ADMIN_EMAIL`
  Email login admin untuk membuka panel admin.

- `ADMIN_PASSWORD`
  Kata sandi login admin untuk membuka panel admin.

### Frontend production server

- `PORT`
  Opsional. Port untuk `next start`. Default bawaan Next biasanya `3000`.

## Endpoint Backend

- `GET /health`
  Health check backend.

- `GET /competitions`
  Mengembalikan daftar kompetisi read-only untuk katalog publik dan panel admin.

- `POST /competitions`
  Menambahkan kompetisi baru dari panel admin.

- `PUT /competitions/:id`
  Memperbarui data kompetisi berdasarkan ID.

- `DELETE /competitions/:id`
  Menghapus kompetisi berdasarkan ID.

Catatan keamanan endpoint write:

- Jika `BACKEND_ADMIN_TOKEN` diatur, endpoint write backend akan menolak request tanpa token dengan respons `401`.

Contoh respons:

```json
{
  "ok": true,
  "data": [],
  "total": 0
}
```

## Setup Database Supabase Cloud

1. Buat project baru di `https://supabase.com`.
2. Buka menu SQL Editor, lalu jalankan SQL berikut:

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

3. Isi environment `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` dari `Project Settings > API`.
4. Jalankan `pnpm dev`, lalu cek endpoint `GET /competitions` untuk memastikan data terbaca dari Supabase.

## Halaman Penting

- `/` -> katalog publik kompetisi
- `/admin` -> landing admin
- `/admin/panel` -> panel admin pengelolaan data kompetisi

## Login Admin

1. Pastikan `ADMIN_EMAIL` dan `ADMIN_PASSWORD` terisi di `.env`.
2. Jalankan aplikasi: `pnpm dev`.
3. Buka `http://localhost:3000/admin`.
4. Login memakai kredensial dari environment, lalu sistem akan membuat session cookie dan redirect ke `/admin/panel`.

## Status Pengembangan

Lihat detail roadmap di [PLAN.md](./PLAN.md).

Ringkasan status saat ini:

- Phase 1: Frontend Foundation -> selesai
- Phase 2: Monorepo Split frontend/backend -> selesai
- Phase 3: Backend Service Baseline -> selesai awal
- Phase 4: Integrasi Frontend ke Backend API -> selesai
- Phase 5: Konsolidasi Data Admin -> selesai

## Deployment

Panduan deployment detail tersedia di [DEPLOYMENT.md](./DEPLOYMENT.md).

File tersebut mencakup:

- persiapan VPS
- setup Node.js, pnpm, Nginx, dan systemd
- konfigurasi GitHub Actions
- setup secret GitHub
- alur deploy otomatis ke VPS pribadi
- troubleshooting umum

Untuk deployment terbaru: frontend dan backend jalan di VPS, sedangkan database berada di Supabase Cloud.

## Catatan Pengembangan

- Session admin sudah aktif untuk melindungi panel, tetapi kredensialnya masih berbasis environment variable sederhana.
- Aksi simpan dan hapus di panel admin sudah terhubung ke backend melalui Server Action.
- Validasi input write kini menggunakan Zod sebelum mutasi dikirim.
- Penyimpanan data kompetisi sudah memakai Supabase Cloud (persisten lintas restart service).

## Lisensi

Belum ditentukan.
