"use client";

import { useState } from "react";
import { CompetitionDetailModal } from "@/components/CompetitionDetailModal";
import { StatusBadge } from "@/components/StatusBadge";
import type { Competition } from "@/lib/types";
import { formatDate, getCompetitionStatus, getDaysUntilDeadline } from "@/lib/utils/competitions";

interface SpotlightSectionProps {
  competitions: Competition[];
  now: Date;
}

export function SpotlightSection({ competitions, now }: SpotlightSectionProps) {
  const [activeCompetition, setActiveCompetition] = useState<Competition | null>(null);

  if (competitions.length === 0) {
    return null;
  }

  return (
    <>
      <section className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl shadow-zinc-950/60">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
              Spotlight Deadline
            </p>
            <h2 className="mt-2 font-brand text-3xl text-zinc-50">Prioritas Minggu Ini</h2>
          </div>
          <p className="text-sm text-zinc-400">Urut berdasar urgensi dan prioritas</p>
        </div>

        <ul className="grid gap-3 md:grid-cols-3">
          {competitions.map((competition) => {
            const status = getCompetitionStatus(competition, now);
            const daysLeft = getDaysUntilDeadline(competition.regEnd, now);

            return (
              <li key={competition.id}>
                <button
                  type="button"
                  onClick={() => setActiveCompetition(competition)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/85 p-4 text-left transition hover:border-zinc-600"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={status} />
                    {competition.isPriority ? (
                      <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-100">
                        Prioritas
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 text-lg font-semibold text-zinc-50">{competition.name}</h3>
                  <p className="mt-1 text-sm text-zinc-300">{competition.organizer}</p>

                  <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Deadline Registrasi</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-100">{formatDate(competition.regEnd)}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {daysLeft >= 0 ? `${daysLeft} hari lagi` : "Sudah lewat"}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <CompetitionDetailModal
        competition={activeCompetition ?? competitions[0]}
        now={now}
        isOpen={activeCompetition !== null}
        onClose={() => setActiveCompetition(null)}
      />
    </>
  );
}
