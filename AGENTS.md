# AGENTS.md — CompBase

Panduan ini berlaku untuk semua AI agent (Claude, Copilot, Cursor, dsb.) yang bekerja di repo ini. Ikuti seluruh aturan di bawah tanpa pengecualian, kecuali ada instruksi eksplisit yang bertentangan langsung dari user di thread yang sama.

---

## Prinsip Umum

- Tulis kode yang **mudah dibaca manusia** — bukan kode yang cerdas tapi sulit dipahami.
- Selalu gunakan **TypeScript** dengan tipe yang eksplisit. Jangan gunakan `any`.
- Ikuti konvensi nama yang sudah ada di repo sebelum membuat nama baru.
- Jangan menghapus kode yang sudah ada kecuali diminta secara eksplisit.
- Jangan menambahkan dependency baru tanpa alasan yang jelas dan persetujuan user.
- Semua komentar kode ditulis dalam **Bahasa Indonesia**.

---

## Aturan React & Next.js

### ❌ Dilarang: `useEffect`

**Jangan pernah menggunakan `useEffect` untuk fetching data, komputasi turunan, atau sinkronisasi state.**

`useEffect` adalah escape hatch, bukan pola utama. Hampir semua kebutuhan yang terasa seperti butuh `useEffect` bisa diselesaikan dengan cara yang lebih baik:

| Kebutuhan | Ganti dengan |
|---|---|
| Fetch data saat komponen mount | Server Component + `async/await` langsung |
| Fetch data di client | `useSWR` atau `useQuery` (TanStack Query) |
| Komputasi dari state/props | `useMemo` |
| Event handler dengan side effect | Handler function biasa di `onClick`, `onSubmit`, dsb. |
| Sinkronisasi dua state | Derivasi langsung saat render, bukan `useEffect` + `setState` |
| Subscribe ke external store | `useSyncExternalStore` |
| Jalankan kode sekali saat app load | Route handler atau Server Action |

**Contoh salah:**
```tsx
// ❌ JANGAN — fetch data dengan useEffect
const [competitions, setCompetitions] = useState([])

useEffect(() => {
  fetch('/api/competitions')
    .then(r => r.json())
    .then(data => setCompetitions(data))
}, [])
```

**Contoh benar:**
```tsx
// ✅ Fetch di Server Component
export default async function Page() {
  const supabase = createServerClient()
  const { data } = await supabase.from('competitions').select('*')
  return <CompGrid initialData={data ?? []} />
}
```

```tsx
// ✅ Fetch di client dengan SWR jika memang butuh client-side
const { data, isLoading } = useSWR('/api/competitions', fetcher)
```

**Pengecualian yang diizinkan** — `useEffect` boleh digunakan hanya untuk:
- Subscribe ke browser API yang tidak punya abstraksi lain (misalnya `IntersectionObserver`, `ResizeObserver`, event listener DOM yang memang hanya ada di browser)
- Cleanup side effect yang benar-benar bersifat imperatif (misalnya `clearTimeout`, `removeEventListener`)
- Integrasi dengan library pihak ketiga yang mengharuskan imperative initialization

Bahkan dalam pengecualian di atas, selalu sertakan cleanup function dan dependency array yang lengkap.

---

### Gunakan Server Components sebagai Default

Setiap komponen adalah Server Component kecuali ada alasan konkret untuk menjadikannya Client Component. Tandai `'use client'` hanya jika komponen membutuhkan:
- State interaktif (`useState`, `useReducer`)
- Browser API
- Event handler interaktif yang tidak bisa di-handle di server

```tsx
// ✅ Default — Server Component, tidak perlu deklarasi
export default async function CompGrid() {
  const data = await fetchCompetitions()
  return <ul>{data.map(c => <CompCard key={c.id} comp={c} />)}</ul>
}

// ✅ Client Component — hanya jika benar-benar perlu interaktivitas
'use client'
export default function FilterBar() {
  const [search, setSearch] = useState('')
  // ...
}
```

### Gunakan Server Actions untuk Mutasi Data

Semua operasi write (insert, update, delete) menggunakan Server Actions — bukan API routes, bukan fetch ke `/api/*` dari client.

```tsx
// ✅ Server Action
'use server'
export async function deleteCompetition(id: string) {
  const supabase = createServerClient()
  await supabase.from('competitions').delete().eq('id', id)
  revalidatePath('/admin/dashboard')
}

// ✅ Dipanggil langsung dari form atau handler
<button onClick={() => deleteCompetition(comp.id)}>Hapus</button>
```

### Validasi dengan Zod di Dua Sisi

Setiap input dari user divalidasi dua kali:
1. **Client-side** — untuk feedback instan sebelum submit
2. **Server-side** — di Server Action atau API route, sebagai source of truth

```tsx
// lib/schemas.ts — satu schema, dipakai di dua tempat
export const competitionSchema = z.object({ ... })

// Client: validasi sebelum submit
const result = competitionSchema.safeParse(formData)
if (!result.success) { /* tampilkan error */ }

// Server Action: validasi ulang
'use server'
export async function saveCompetition(data: unknown) {
  const parsed = competitionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }
  // lanjut simpan ke Supabase
}
```

---

## Aturan TypeScript

- Selalu definisikan tipe return function yang tidak trivial.
- Gunakan `type` untuk union/intersection, `interface` untuk shape objek yang akan di-extend.
- Jangan gunakan type assertion (`as SomeType`) kecuali benar-benar tidak ada alternatif — dan jika terpaksa, tambahkan komentar yang menjelaskan mengapa.
- Semua tipe yang dipakai lebih dari satu tempat didefinisikan di `lib/types.ts`.

```tsx
// ✅ Tipe eksplisit
function getCompStatus(comp: Competition): CompStatus { ... }

// ❌ Hindari any
function processData(data: any) { ... }

// ✅ Pakai unknown + type guard jika tipe tidak diketahui
function processData(data: unknown) {
  if (!isCompetition(data)) throw new Error('Invalid data')
  // ...
}
```

---

## Aturan Supabase

- **Halaman publik** → gunakan `createServerClient()` dengan anon key (RLS berlaku).
- **Admin / operasi write** → gunakan `createServerClient()` dengan service role key, **hanya di server** (Server Component, Server Action, API route). Jangan pernah kirim service role key ke client.
- Selalu handle error dari Supabase — jangan biarkan `error` dari response diabaikan.

```tsx
// ✅ Handle error Supabase
const { data, error } = await supabase.from('competitions').select('*')
if (error) {
  console.error('Supabase error:', error.message)
  throw new Error('Gagal mengambil data kompetisi.')
}
```

---

## Aturan Styling

- Gunakan **Tailwind CSS** utility classes — jangan tulis CSS custom kecuali benar-benar tidak bisa dilakukan dengan Tailwind.
- Gunakan komponen dari **shadcn/ui** jika tersedia sebelum membuat komponen UI baru dari scratch.
- Dark mode adalah default — setiap elemen baru harus terlihat baik di dark mode.
- Jangan hardcode warna hex — gunakan token Tailwind (`text-zinc-400`, `bg-zinc-900`, dsb.).

---

## Aturan File & Struktur

- Satu komponen per file. Nama file = nama komponen (PascalCase).
- Komponen publik (halaman) → `components/` atau `app/`
- Komponen admin → `components/admin/`
- Logic yang bisa dipakai ulang → `lib/` atau `hooks/`
- Jangan taruh logic bisnis di dalam komponen — ekstrak ke `lib/utils.ts` atau hook tersendiri.

---

## Aturan Commit

Format pesan commit mengikuti **Conventional Commits**:

```
<type>(<scope>): <deskripsi singkat dalam Bahasa Indonesia>

Contoh:
feat(admin): tambah form upload poster kompetisi
fix(filter): perbaiki filter tab tersimpan tidak sinkron dengan localStorage
refactor(hooks): ganti useEffect fetch ke Server Component
chore(deps): update supabase-js ke 2.43.0
```

Type yang digunakan: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`.

---

## Checklist Sebelum Selesai

Sebelum menyerahkan perubahan, pastikan:

- [ ] Tidak ada `useEffect` yang digunakan untuk fetching atau komputasi
- [ ] Tidak ada `any` dalam TypeScript
- [ ] Semua error dari Supabase ditangani
- [ ] Komponen baru sudah diuji di dark mode
- [ ] Tidak ada console.log yang tertinggal
- [ ] Semua variabel environment yang dibutuhkan sudah didokumentasikan di `.env.example`
- [ ] Server Action atau API route yang menulis data sudah memvalidasi input dengan Zod
