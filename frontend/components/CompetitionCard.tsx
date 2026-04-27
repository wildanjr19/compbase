"use client";

import { StatusBadge } from "@/components/StatusBadge";
import type { Competition } from "@/lib/types";
import {
  formatDate,
  formatDateRange,
  getCompetitionStatus,
  getDaysUntilDeadline,
} from "@/lib/utils/competitions";

interface CompetitionCardProps {
  competition: Competition;
  now: Date;
  index: number;
  onOpenDetail: (competition: Competition) => void;
}

export function CompetitionCard({ competition, now, index, onOpenDetail }: CompetitionCardProps) {
  const status = getCompetitionStatus(competition, now);
  const daysLeft = getDaysUntilDeadline(competition.regEnd, now);
  const isLeadCard = index === 0;

  return (
    <button
      type="button"
      onClick={() => onOpenDetail(competition)}
      className={`group soft-panel block w-full overflow-hidden rounded-[1.2rem] border border-line-soft/80 bg-surface-1/24 text-left hover:border-zinc-500/70 ${
        isLeadCard ? "lg:grid lg:grid-cols-[minmax(0,1.18fr)_0.82fr]" : ""
      }`}
    >
      <div className="p-3.5 md:p-4 lg:p-[1.05rem]">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          {competition.hasGuidebook ? (
            <span className="rounded-full border border-accent-emerald/24 bg-accent-emerald/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-emerald">
              Ada guidebook
            </span>
          ) : null}
        </div>

        <div className="mt-2">
          <p className="text-sm text-zinc-400">
            {competition.category} | {competition.organizer}
          </p>
          <h3
            className={`mt-1 leading-tight text-zinc-50 ${
              isLeadCard ? "font-brand text-[clamp(1.7rem,4vw,2.8rem)]" : "text-[1.32rem] font-semibold"
            }`}
          >
            {competition.name}
          </h3>
        </div>
      </div>

      <div
        className={`grid gap-1.5 px-3.5 pb-3.5 pt-0 md:px-4 md:pb-4 lg:px-[1.05rem] lg:pb-[1.05rem] ${
          isLeadCard ? "lg:self-center lg:pt-[1.05rem]" : "pt-0.5"
        }`}
      >
        <div className="rounded-[0.9rem] bg-black/12 p-2.5 ring-1 ring-white/6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Deadline pendaftaran</p>
          <p className="mt-1 font-medium text-zinc-100">{formatDate(competition.regEnd)}</p>
          <p className="mt-1 text-[11px] text-zinc-400">
            {daysLeft === null ? "Belum ditentukan" : daysLeft >= 0 ? `${daysLeft} hari lagi` : "Sudah lewat"}
          </p>
        </div>

        <div className="rounded-[0.9rem] bg-black/12 p-2.5 ring-1 ring-white/6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Penyisihan</p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-100">
            {formatDateRange(competition.eventStart, competition.eventEnd)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 px-0.5 pt-0.5">
          <span className="text-xs uppercase tracking-[0.28em] text-zinc-600">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="inline-flex items-center gap-2 text-[13px] text-zinc-300">
            Lihat detail
            <span className="inline-flex h-[1.625rem] w-[1.625rem] items-center justify-center rounded-full border border-zinc-700/70 text-zinc-400 transition group-hover:border-zinc-500 group-hover:text-zinc-200">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 5.25L7 9.25L11 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}
