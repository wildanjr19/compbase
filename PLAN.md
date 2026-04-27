# Plan - CompBase (Monorepo)

## Phase 1: Frontend Foundation
- Status: Selesai
- Catatan: Landing page publik, filter URL-based, spotlight, dan kartu kompetisi sudah siap.

## Phase 2: Monorepo Split frontend/backend
- Status: Selesai
- Catatan: Struktur repo dipisah menjadi folder frontend dan backend dengan pnpm workspace.

## Phase 3: Backend Service Baseline
- Status: Selesai awal
- Catatan: Backend TypeScript sudah berjalan dengan endpoint health check di `/health`.

## Phase 4: Integrasi Frontend <-> Backend API
- Status: Selesai
- Catatan: Backend sudah menyediakan endpoint katalog kompetisi, frontend memakai data backend dengan fallback ke data lokal saat koneksi bermasalah.

### Checklist Teknis Phase 4
- [x] Menambahkan endpoint data kompetisi di backend (read-only).
- [x] Menghubungkan frontend ke endpoint backend untuk data nyata.
- [x] Menambahkan penanganan error dan fallback UI di frontend.
- [x] Menyiapkan konfigurasi environment (`BACKEND_BASE_URL`) untuk dev dan production.

## Phase 5: Konsolidasi Data Admin
- Status: Selesai
- Catatan: Panel admin kini terhubung penuh ke mutasi backend untuk aksi create/update/delete, dengan validasi input di sisi client dan server action sebelum request dikirim.

### Checklist Teknis Phase 5
- [x] Menghubungkan panel admin ke endpoint backend untuk data baca awal.
- [x] Menambahkan login admin dasar untuk melindungi route `/admin/panel`.
- [x] Merapikan editor admin agar bisa mengelola deskripsi, prioritas, validasi, reset draft, dan duplikasi data secara lokal.
- [x] Menyiapkan endpoint create/update/delete kompetisi di backend.
- [x] Menghubungkan aksi simpan/hapus admin ke backend.
- [x] Menambahkan validasi input admin sebelum mutasi data dikirim.

## Phase 6: Deployment ke VPS Pribadi
- Status: In Progress
- Catatan: Jalur deploy diarahkan ke VPS pribadi dengan GitHub Actions, restart service via systemd, dan reverse proxy Nginx. Dokumentasi deployment detail sudah tersedia, proteksi token untuk endpoint write backend sudah ditambahkan, dan implementasi workflow mulai disiapkan di repo.

### Checklist Teknis Phase 6
- [x] Menyusun panduan deployment step-by-step di `DEPLOYMENT.md`.
- [x] Menyesuaikan dokumentasi environment untuk kebutuhan production.
- [x] Menambahkan workflow GitHub Actions untuk build dan deploy ke VPS.
- [x] Menentukan branch deploy utama dan daftar GitHub Secrets yang wajib diisi.
- [x] Menambahkan checklist verifikasi pascadeploy untuk frontend dan backend.
- [x] Menambahkan proteksi token opsional untuk endpoint write backend (`POST/PUT/DELETE`).

## Phase 7: Persistensi Data dan Mutasi Admin
- Status: In Progress
- Catatan: Validasi Zod sudah ditambahkan dan mutasi panel admin sudah aktif ke backend in-memory. Penyimpanan persisten production masih menjadi pekerjaan lanjutan.

### Checklist Teknis Phase 7
- [x] Menambahkan dependency validasi yang disetujui untuk alur write.
- [x] Menyusun schema input kompetisi yang dipakai client dan server.
- [x] Menyambungkan panel admin ke alur simpan/hapus data nyata.
- [ ] Menentukan penyimpanan data production yang persisten.
