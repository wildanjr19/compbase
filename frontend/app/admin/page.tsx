import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { isAdminAuthenticated } from "@/lib/auth";

export default async function AdminLoginPage() {
  const authenticated = await isAdminAuthenticated();

  if (authenticated) {
    redirect("/admin/panel");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-10rem] h-[26rem] w-[40rem] -translate-x-1/2 rounded-full bg-amber-300/12 blur-[120px]" />
        <div className="absolute bottom-[-8rem] left-[12%] h-[22rem] w-[22rem] rounded-full bg-emerald-300/10 blur-[120px]" />
        <div className="absolute right-[10%] top-[18%] h-[24rem] w-[24rem] rounded-full bg-sky-300/10 blur-[130px]" />
      </div>

      <section className="relative w-full max-w-md rounded-[1.9rem] border border-white/10 bg-[oklch(0.17_0.02_250_/_0.88)] p-6 shadow-[0_36px_100px_-52px_oklch(0.05_0.03_270)] backdrop-blur-2xl sm:p-8">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/45 to-transparent" />

        <div className="space-y-3 text-center">
          <span className="inline-flex rounded-full border border-amber-200/18 bg-amber-200/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-amber-100">
            Admin CompBase
          </span>
          <h1 className="font-brand text-[clamp(2rem,7vw,3.1rem)] leading-none text-zinc-50">
            Masuk ke ruang kendali.
          </h1>
          <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
            Gunakan akun admin untuk mengelola daftar lomba, memperbarui informasi, dan menjaga semua tanggal tetap akurat.
          </p>
        </div>

        <AdminLoginForm />

        <div className="mt-6 flex items-center justify-between gap-3 text-sm text-zinc-400">
          <span>Akses internal CompBase</span>
          <Link href="/" className="text-zinc-200 transition hover:text-amber-100">
            Kembali ke beranda
          </Link>
        </div>
      </section>
    </main>
  );
}
