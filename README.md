# CompBase

CompBase adalah platform katalog kompetisi berbasis web untuk memusatkan informasi lomba dalam satu tempat yang rapi, cepat dicari, dan mudah diperbarui. Proyek ini berfokus pada kebutuhan mahasiswa dan komunitas data untuk menemukan peluang kompetisi tanpa harus berpindah-pindah kanal informasi.

Di sisi publik, pengguna bisa menjelajahi daftar lomba, melihat prioritas kompetisi terdekat, memfilter status pendaftaran, dan membuka detail tautan penting. Di sisi admin, pengelola dapat menjaga kualitas katalog melalui alur tambah, edit, validasi, prioritas, review pengajuan user, audit log, dan sinkronisasi data ke backend.

## Fitur Utama

- Katalog kompetisi publik dengan pencarian, filter status, dan pengurutan.
- Section `Pilihan cepat` berbasis kompetisi prioritas (maksimal 3 prioritas).
- Detail kompetisi dengan informasi tanggal dan tautan penting.
- Form pengajuan kompetisi dari user (alur publik).
- Panel admin untuk:
  - tambah, edit, duplikasi, dan hapus kompetisi
  - set/unset prioritas kompetisi
  - approve, reject, dan hapus pengajuan kompetisi
- Homepage memakai cache server (`unstable_cache`) + invalidasi tag setelah mutasi admin.
- Audit log aksi admin tersimpan ke tabel `admin_audit_logs` di Supabase.
- Autentikasi admin memakai `ADMIN_PASSWORD_HASH` (scrypt) + signed session cookie. Plaintext password tidak lagi didukung.
- Rate limiting backend untuk endpoint submit publik dan endpoint write admin.
- Validasi input menggunakan Zod di layer frontend dan backend.
- Backend mendukung 2 sumber data:
  - Supabase (production-ready)
  - Local JSON fallback (untuk pengembangan cepat)

## Struktur Direktori

```text
compbase/
├─ frontend/                # Aplikasi Next.js (UI publik + panel admin)
│  ├─ app/                  # Routing App Router
│  ├─ components/           # Komponen UI
│  └─ lib/                  # Tipe, utilitas, schema, helper
├─ backend/                 # API Node.js + store data
│  ├─ src/
│  │  ├─ server.ts          # HTTP server + routing endpoint
│  │  ├─ dataStore.ts       # Abstraksi store Supabase/local
│  │  ├─ competition.ts     # Model + validasi kompetisi
│  │  └─ submission.ts      # Model + validasi pengajuan
│  └─ .local/               # Fallback data JSON lokal
├─ supabase/                # SQL/schema pendukung Supabase
├─ .env.example             # Contoh environment variables
└─ package.json             # Workspace scripts
```

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Backend: Node.js (native HTTP server), TypeScript
- Data: Supabase (`@supabase/supabase-js`)
- Validation: Zod
- Monorepo tooling: pnpm workspace

## Cara Setup

### 1. Prasyarat

- Node.js 20+
- pnpm 10+

### 2. Clone dan install dependency

```bash
git clone <repo-url>
cd compbase
pnpm install
```

### 3. Siapkan environment

Salin isi `.env.example` ke `.env` lalu isi sesuai kebutuhan.

```bash
cp .env.example .env
```

#### 3a. Generate hash password admin (wajib untuk pertama kali)

Jika Anda belum memiliki `ADMIN_PASSWORD_HASH`, generate dengan script bawaan:

```bash
pnpm admin:hash-password "password-admin-anda"
```

Copy output hash ke file `.env` sebagai nilai `ADMIN_PASSWORD_HASH`.

Variabel penting:

- `BACKEND_PORT`: port service backend (default `4000`)
- `BACKEND_BASE_URL`: base URL backend yang diakses frontend
- `SUPABASE_URL`: URL project Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: service role key Supabase (server-only)
- `SUPABASE_COMPETITIONS_TABLE`: nama tabel kompetisi
- `SUPABASE_SUBMISSIONS_TABLE`: nama tabel pengajuan
- `LOCAL_COMPETITIONS_FILE_PATH`: fallback file lokal kompetisi
- `LOCAL_SUBMISSIONS_FILE_PATH`: fallback file lokal pengajuan
- `BACKEND_ADMIN_TOKEN`: token proteksi endpoint write backend
- `BACKEND_TRUST_PROXY`: aktifkan `true` hanya jika backend di balik reverse proxy tepercaya
- `ADMIN_EMAIL`: email login panel admin
- `ADMIN_PASSWORD_HASH`: hash password admin (scrypt, **wajib** diisi)
- `ADMIN_SESSION_SECRET`: secret signing session cookie admin (**wajib** diisi di production)

Catatan:
- Jika `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` dikosongkan, backend otomatis memakai fallback file lokal.
- `ADMIN_PASSWORD_HASH` wajib diisi. Gunakan script `pnpm admin:hash-password "passwordmu"` untuk generate hash.

### 4. Jalankan mode development

Menjalankan frontend dan backend bersamaan:

```bash
pnpm dev
```

Atau jalankan terpisah:

```bash
pnpm dev:frontend
pnpm dev:backend
```

### 5. Akses aplikasi

- Publik: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`
- Panel admin: `http://localhost:3000/admin/panel`
- Backend health check: `http://localhost:4000/health`

## Scripts

- `pnpm dev` menjalankan semua service di workspace.
- `pnpm build` build semua package.
- `pnpm lint` lint frontend.
- `pnpm start:frontend` menjalankan frontend production mode.
- `pnpm start:backend` menjalankan backend production mode.
- `pnpm --filter backend migrate:supabase` migrasi data lokal ke Supabase.

## Future Work

- Notifikasi otomatis saat status pengajuan berubah.
- Scheduler sinkronisasi/validasi tanggal kompetisi.
- Auto-refresh ringan untuk status dan sisa waktu katalog (opsional, interval 1-5 menit, fokus hemat beban).
- Integrasi upload aset (poster/banner) ke object storage.
- Dashboard monitoring audit log (filter per admin/aksi/entitas).
