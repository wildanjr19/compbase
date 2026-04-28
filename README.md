# CompBase

CompBase adalah katalog kompetisi yang dirancang untuk membantu mahasiswa dan pegiat data menemukan lomba yang relevan dalam satu tempat. Fokus utamanya ada pada kompetisi statistik, data science, data mining, hackathon, datathon, essay, infografis, dan format serupa yang sering tersebar di banyak kanal.

Platform ini memiliki dua sisi utama. Sisi publik menampilkan daftar kompetisi yang bisa dijelajahi dengan pencarian, filter, urutan, spotlight, dan detail tautan penting. Sisi admin dipakai untuk mengelola data kompetisi agar katalog tetap rapi, konsisten, dan mudah diperbarui saat ada agenda baru atau perubahan jadwal.

Saat ini CompBase sudah mencakup:

- katalog kompetisi publik dengan navigasi yang cepat
- spotlight untuk kompetisi prioritas
- detail kompetisi yang merangkum informasi penting
- panel admin untuk tambah, edit, duplikasi, reset draft, dan hapus data
- validasi data agar informasi yang tampil tetap lebih terjaga

Halaman utama yang tersedia:

- `/` untuk katalog publik
- `/admin` untuk akses admin
- `/admin/panel` untuk pengelolaan kompetisi

CompBase dikembangkan sebagai fondasi katalog kompetisi yang bisa terus diperluas seiring kebutuhan kurasi, pengelolaan data, dan pengalaman admin yang makin matang.
=======
CompBase adalah platform katalog kompetisi berbasis web untuk memusatkan informasi lomba dalam satu tempat yang rapi, cepat dicari, dan mudah diperbarui. Proyek ini berfokus pada kebutuhan mahasiswa dan komunitas data untuk menemukan peluang kompetisi tanpa harus berpindah-pindah kanal informasi.

Di sisi publik, pengguna bisa menjelajahi daftar lomba, melihat prioritas kompetisi terdekat, memfilter status pendaftaran, dan membuka detail tautan penting. Di sisi admin, pengelola dapat menjaga kualitas katalog melalui alur tambah, edit, validasi, prioritas, review pengajuan user, dan sinkronisasi data ke backend.

## Fitur Utama

- Katalog kompetisi publik dengan pencarian, filter status, dan pengurutan.
- Section `Pilihan cepat` berbasis kompetisi prioritas (maksimal 3 prioritas).
- Detail kompetisi dengan informasi tanggal dan tautan penting.
- Form pengajuan kompetisi dari user (alur publik).
- Panel admin untuk:
  - tambah, edit, duplikasi, dan hapus kompetisi
  - set/unset prioritas kompetisi
  - approve, reject, dan hapus pengajuan kompetisi
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
- `ADMIN_EMAIL` dan `ADMIN_PASSWORD`: kredensial login panel admin

Catatan:
- Jika `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` dikosongkan, backend otomatis memakai fallback file lokal.

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

- Role-based access control untuk admin multi-level.
- Audit log perubahan data di panel admin.
- Notifikasi otomatis saat status pengajuan berubah.
- Scheduler sinkronisasi/validasi tanggal kompetisi.
- Statistik dashboard (tren kategori, organizer aktif, deadline terdekat).
- Integrasi upload aset (poster/banner) ke object storage.

## Ringkasan

CompBase dibangun sebagai fondasi katalog kompetisi yang terkurasi, mudah dikelola, dan siap ditingkatkan ke skala lebih besar. Fokus utama proyek ini adalah menjaga kualitas data kompetisi sekaligus menghadirkan pengalaman pencarian yang cepat dan jelas untuk pengguna publik.
>>>>>>> theirs
