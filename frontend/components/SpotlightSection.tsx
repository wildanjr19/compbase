"use client";

import { StatusBadge } from "@/components/StatusBadge";
import type { Competition } from "@/lib/types";
import {
  formatDate,
  getCompetitionStatus,
  getDaysUntilDeadline,
} from "@/lib/utils/competitions";

interface SpotlightSectionProps {
  competitions: Competition[];
  now: Date;
  onOpenDetail: (competition: Competition) => void;
}

export function SpotlightSection({
  competitions,
  now,
  onOpenDetail,
}: SpotlightSectionProps) {
  if (competitions.length === 0) {
    return null;
  }

  const primaryCompetition = competitions[0];
  const secondaryCompetitions = competitions.slice(1);

  if (!primaryCompetition) {
    return null;
  }

  const primaryStatus = getCompetitionStatus(primaryCompetition, now);
  const primaryDaysLeft = getDaysUntilDeadline(primaryCompetition.regEnd, now);

  return (
    <section className="reveal-up reveal-delay-1 space-y-4 rounded-[1.4rem] p-1 md:p-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Pilihan cepat</p>
          <h2 className="mt-2 font-brand text-3xl text-zinc-50 sm:text-[2.2rem]">
            Deadline pendaftaran
          </h2>
        </div>
        <p className="max-w-sm text-sm text-zinc-400">
          Kalau mau mulai dari yang paling urgent, cek bagian ini dulu.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <button
          type="button"
          onClick={() => onOpenDetail(primaryCompetition)}
          className="group overflow-hidden rounded-[1.2rem] border border-white/6 bg-white/[0.026] text-left hover:border-violet-200/16"
        >
          <div className="grid gap-4 p-4 md:p-[1.125rem] lg:grid-cols-[1.1fr_0.9fr] lg:p-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={primaryStatus} />
              </div>

              <div>
                <p className="text-sm text-zinc-400">
                  {primaryCompetition.category} | {primaryCompetition.organizer}
                </p>
                <h3 className="mt-3 max-w-xl font-brand text-[clamp(1.85rem,4vw,3.2rem)] leading-[1] text-zinc-50">
                  {primaryCompetition.name}
                </h3>
              </div>
            </div>

            <div className="grid gap-2.5 self-start rounded-[1rem] border border-white/7 bg-black/8 p-3.5">
              <div className="border-b border-white/6 pb-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Deadline pendaftaran
                </p>
                <p className="mt-2 text-xl font-semibold text-zinc-100">
                  {formatDate(primaryCompetition.regEnd)}
                </p>
              </div>
              <div className="border-b border-white/6 pb-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Penyisihan
                </p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-200">
                  {formatDate(primaryCompetition.eventStart)} sampai{" "}
                  {formatDate(primaryCompetition.eventEnd)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Sisa waktu
                </p>
                <p className="mt-2 text-3xl font-semibold text-accent-gold/95">
                  {primaryDaysLeft === null
                    ? "Menunggu jadwal"
                    : primaryDaysLeft >= 0
                      ? `${primaryDaysLeft} hari`
                      : "Terlambat"}
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  Pas buat kamu yang lagi cari opsi paling dekat.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 lg:col-span-2">
              <span className="text-sm text-zinc-300">Lihat detail</span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700/70 text-zinc-400 transition group-hover:border-zinc-500 group-hover:text-zinc-200">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 5.25L7 9.25L11 5.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
        </button>

        <ul className="grid gap-2.5">
          {secondaryCompetitions.map((competition) => {
            const status = getCompetitionStatus(competition, now);
            const daysLeft = getDaysUntilDeadline(competition.regEnd, now);

            return (
              <li key={competition.id}>
                <button
                  type="button"
                  onClick={() => onOpenDetail(competition)}
                  className="block w-full rounded-[1.1rem] border border-white/6 bg-white/[0.022] p-3.5 text-left hover:border-violet-200/16"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={status} />
                  </div>

                  <h3 className="mt-4 text-xl font-semibold leading-tight text-zinc-50">
                    {competition.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-300">
                    {competition.category} | {competition.organizer}
                  </p>

                  <div className="mt-3 grid gap-2.5 border-t border-white/6 pt-3 text-sm text-zinc-300">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                        Deadline pendaftaran
                      </span>
                      <span className="font-medium text-zinc-100">
                        {formatDate(competition.regEnd)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                        Sisa waktu
                      </span>
                      <span>
                        {daysLeft === null
                          ? "Belum ditentukan"
                          : daysLeft >= 0
                            ? `${daysLeft} hari lagi`
                            : "Sudah lewat"}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
