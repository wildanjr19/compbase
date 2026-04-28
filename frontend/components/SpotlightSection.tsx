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
      <div className="flex flex-wrap items-end justify-between gap-3 text-center sm:text-left">
        <div className="w-full sm:w-auto">
          <p className="section-kicker">Pilihan cepat</p>
          <h2 className="mt-2 font-brand text-[1.85rem] text-zinc-50 sm:text-[2.05rem]">
            Deadline pendaftaran
          </h2>
        </div>
        <p className="mx-auto max-w-sm text-[0.95rem] leading-relaxed text-zinc-400 sm:mx-0">
          Kalau mau mulai dari yang paling urgent, cek bagian ini dulu.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <button
          type="button"
          onClick={() => onOpenDetail(primaryCompetition)}
          className="motion-surface group overflow-hidden rounded-[1.2rem] border border-white/8 bg-white/[0.03] text-left hover:border-violet-200/18"
        >
          <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)]">
            <div className="grid gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={primaryStatus} />
              </div>

              <div className="space-y-3.5">
                <p className="text-[0.95rem] leading-relaxed text-zinc-400">
                  {primaryCompetition.category} | {primaryCompetition.organizer}
                </p>
                <h3 className="max-w-xl font-brand text-[clamp(1.85rem,3.9vw,2.95rem)] leading-[1.02] text-zinc-50">
                  {primaryCompetition.name}
                </h3>
              </div>
            </div>

            <div className="grid gap-4 self-start rounded-[1.05rem] bg-black/14 p-5">
              <dl className="grid gap-1.5">
                <dt className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Deadline pendaftaran
                </dt>
                <dd className="text-[1.32rem] font-semibold leading-tight text-zinc-100">
                  {formatDate(primaryCompetition.regEnd)}
                </dd>
              </dl>
              <dl className="grid gap-1.5">
                <dt className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Penyisihan
                </dt>
                <dd className="text-[1.01rem] font-medium leading-relaxed text-zinc-200">
                  {formatDate(primaryCompetition.eventStart)} sampai{" "}
                  {formatDate(primaryCompetition.eventEnd)}
                </dd>
              </dl>
              <dl className="grid gap-1.5">
                <dt className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Sisa waktu
                </dt>
                <dd className="text-[1.78rem] font-semibold text-accent-gold/95">
                  {primaryDaysLeft === null
                    ? "Menunggu jadwal"
                    : primaryDaysLeft >= 0
                      ? `${primaryDaysLeft} hari`
                      : "Terlambat"}
                </dd>
                <dd className="text-[0.95rem] leading-relaxed text-zinc-300">
                  Pas buat kamu yang lagi cari opsi paling dekat.
                </dd>
              </dl>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 lg:col-span-2">
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
                  className="motion-surface block w-full rounded-[1.1rem] border border-white/6 bg-white/[0.022] p-4 text-left hover:border-violet-200/16"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={status} />
                  </div>

                  <h3 className="mt-4 text-[1.28rem] font-semibold leading-tight text-zinc-50">
                    {competition.name}
                  </h3>
                  <p className="mt-1.5 text-[0.98rem] leading-relaxed text-zinc-300">
                    {competition.category} | {competition.organizer}
                  </p>

                  <div className="mt-3.5 grid gap-3 pt-3 text-[0.95rem] text-zinc-300">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                        Deadline pendaftaran
                      </span>
                      <span className="text-[1rem] font-semibold leading-tight text-zinc-100">
                        {formatDate(competition.regEnd)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                        Sisa waktu
                      </span>
                      <span className="font-medium">
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
