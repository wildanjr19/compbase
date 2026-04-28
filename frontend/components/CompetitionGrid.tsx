import { CompetitionCard } from "@/components/CompetitionCard";
import type { Competition } from "@/lib/types";

interface CompetitionGridProps {
  competitions: Competition[];
  totalCompetitions: number;
  hiddenCompetitionsCount: number;
  now: Date;
  onOpenDetail: (competition: Competition) => void;
  onShowAll?: () => void;
}

export function CompetitionGrid({
  competitions,
  totalCompetitions,
  hiddenCompetitionsCount,
  now,
  onOpenDetail,
  onShowAll,
}: CompetitionGridProps) {
  if (totalCompetitions === 0) {
    return (
      <section className="soft-panel rounded-[1.5rem] border border-line-soft/80 bg-surface-1/24 p-8 text-center">
        <h2 className="font-brand text-3xl text-zinc-50">Belum ada yang cocok</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
          Coba ganti kata kunci, kategori, atau tab biar hasilnya lebih banyak.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 text-center sm:text-left">
        <div className="w-full sm:w-auto">
          <p className="section-kicker">Daftar lomba</p>
          <h2 className="mt-2 font-brand text-[1.85rem] text-zinc-50 sm:text-[2.15rem]">Semua yang lagi tersedia</h2>
        </div>
        <p className="mx-auto max-w-sm text-[0.95rem] leading-relaxed text-zinc-300 sm:mx-0">
          Menampilkan {competitions.length} dari {totalCompetitions} lomba yang bisa kamu cek sekarang.
        </p>
      </div>

      <ul className="grid gap-4 md:gap-5 lg:grid-cols-2">
        {competitions.map((competition, index) => (
          <li key={competition.id}>
            <CompetitionCard
              competition={competition}
              now={now}
              index={index}
              onOpenDetail={onOpenDetail}
            />
          </li>
        ))}
      </ul>

      {hiddenCompetitionsCount > 0 && onShowAll ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onShowAll}
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-5 text-sm font-medium text-zinc-100 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.06)] hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            Tampilkan semua {totalCompetitions} kompetisi
          </button>
        </div>
      ) : null}
    </section>
  );
}
