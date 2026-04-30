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
- Catatan: Validasi Zod sudah ditambahkan, mutasi panel admin aktif ke backend, cache homepage sudah bisa diinvalidasi, audit log admin sudah tersimpan di Supabase, dan hardening auth/rate limiting dasar sudah diterapkan.

### Checklist Teknis Phase 7
- [x] Menambahkan dependency validasi yang disetujui untuk alur write.
- [x] Menyusun schema input kompetisi yang dipakai client dan server.
- [x] Menyambungkan panel admin ke alur simpan/hapus data nyata.
- [x] Menambahkan cache server pada fetch kompetisi homepage.
- [x] Menambahkan invalidasi cache berbasis tag setelah mutasi admin.
- [x] Menambahkan tabel audit log + helper logging pada server action admin.
- [x] Menambahkan rate limiting backend untuk submit publik dan write admin.
- [x] Memperkuat auth admin (hash password scrypt + signed session cookie).
- [x] Menghapus fallback plaintext password admin (`ADMIN_PASSWORD`).
- [x] Menambahkan script helper `pnpm admin:hash-password` untuk generate hash scrypt.
- [ ] Menentukan penyimpanan data production yang persisten.

## Phase 8: Operasional Production & Keamanan
- Status: In Progress
- Catatan: Dokumentasi deployment sudah diperbarui untuk env keamanan (`ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, `BACKEND_TRUST_PROXY`) dan migration policy audit log RLS.

### Checklist Teknis Phase 8
- [x] Menambahkan migration `admin_audit_logs`.
- [x] Menambahkan migration perbaikan policy RLS audit log.
- [x] Memperbarui dokumentasi README + deployment untuk konfigurasi keamanan.
- [x] Memperbarui dokumentasi untuk menghapus referensi `ADMIN_PASSWORD` plaintext.
- [ ] Menambahkan observability sederhana (error-rate, rate-limit hit, auth failure) untuk operasi harian.
