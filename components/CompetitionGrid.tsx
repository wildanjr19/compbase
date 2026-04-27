import type { Competition } from "@/lib/types";
import { CompetitionCard } from "@/components/CompetitionCard";

interface CompetitionGridProps {
  competitions: Competition[];
  now: Date;
}

export function CompetitionGrid({ competitions, now }: CompetitionGridProps) {
  if (competitions.length === 0) {
    return (
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/75 p-8 text-center shadow-xl shadow-zinc-950/50">
        <h2 className="font-brand text-3xl text-zinc-50">Belum ada hasil yang cocok</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
          Coba ubah kata kunci, reset penyelenggara, atau pindah tab untuk melihat lebih banyak
          kompetisi.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-brand text-3xl text-zinc-50 sm:text-4xl">Katalog Kompetisi</h2>
        <p className="text-sm text-zinc-400">{competitions.length} kompetisi ditampilkan</p>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {competitions.map((competition) => (
          <li key={competition.id}>
            <CompetitionCard competition={competition} now={now} />
          </li>
        ))}
      </ul>
    </section>
  );
}