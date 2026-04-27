import type { CompetitionStats } from "@/lib/types";

interface HeroSectionProps {
  stats: CompetitionStats;
  visibleCount: number;
}

export function HeroSection({ stats, visibleCount }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-700/70 bg-zinc-900/70 p-7 shadow-2xl shadow-zinc-950/60 backdrop-blur md:p-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-14 -bottom-20 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />

      <div className="relative z-10 grid gap-7 md:grid-cols-[1.3fr_1fr] md:items-end">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-300/90">
            Direktori Kompetisi Statistik & Data Science
          </p>
          <h1 className="font-brand text-4xl leading-tight text-zinc-50 sm:text-5xl lg:text-6xl">
            Temukan kompetisi yang tepat sebelum deadline lewat.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            CompBase membantu kamu memindai lomba prioritas, mengurutkan berdasarkan urgensi,
            dan langsung loncat ke tautan registrasi tanpa buka banyak tab.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Masih Buka</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-100">{stats.open}</p>
          </div>
          <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Deadline Dekat</p>
            <p className="mt-2 text-3xl font-semibold text-amber-200">{stats.closingSoon}</p>
          </div>
          <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Prioritas</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-200">{stats.priority}</p>
          </div>
          <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Sedang Ditampilkan</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-100">{visibleCount}</p>
          </div>
        </div>
      </div>
    </section>
  );
}