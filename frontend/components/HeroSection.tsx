import type { CompetitionStats } from "@/lib/types";

interface HeroSectionProps {
  stats: CompetitionStats;
}

export function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="reveal-up rounded-[1.55rem] px-1 py-6 md:px-2 md:py-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-3">
          <span className="section-kicker">CompBase</span>
          <h1 className="max-w-3xl font-brand text-[clamp(2.2rem,5vw,4.2rem)] leading-[1.02] text-zinc-50">
            Cari lomba data yang cocok tanpa ribet.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            Semua info penting dikumpulkan di satu tempat, jadi kamu bisa langsung cek deadline pendaftaran,
            kategori, dan link yang dibutuhkan.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:max-w-md">
          <div className="rounded-[1.1rem] border border-white/7 bg-white/[0.04] px-4 py-3 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Aktif</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-50">{stats.open}</p>
          </div>
          <div className="rounded-[1.1rem] border border-white/7 bg-white/[0.04] px-4 py-3 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Coming Soon</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-50">{stats.comingSoon}</p>
          </div>
          <div className="rounded-[1.1rem] border border-white/7 bg-white/[0.04] px-4 py-3 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Semua</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-50">{stats.total}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
