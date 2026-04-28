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

function getRemainingDaysLabel(daysLeft: number | null): string {
  if (daysLeft === null) {
    return "Tanggal belum ditentukan";
  }

  if (daysLeft >= 0) {
    return `${daysLeft} hari lagi`;
  }

  return "Sudah lewat";
}

export function CompetitionCard({ competition, now, index, onOpenDetail }: CompetitionCardProps) {
  const status = getCompetitionStatus(competition, now);
  const daysLeft = getDaysUntilDeadline(competition.regEnd, now);
  const competitionOrder = String(index + 1).padStart(2, "0");
  const daysLeftLabel = getRemainingDaysLabel(daysLeft);

  return (
    <button
      type="button"
      onClick={() => onOpenDetail(competition)}
      className="motion-surface group soft-panel block w-full overflow-hidden rounded-[1.2rem] border border-line-soft/80 bg-surface-1/24 text-left transition-colors hover:border-zinc-500/70"
    >
      <div className="grid gap-[1.125rem] p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={status} />
          <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-zinc-400">
            #{competitionOrder}
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-[0.98rem] leading-relaxed text-zinc-300">
            {competition.category} | {competition.organizer}
          </p>
          <h3 className="text-[1.52rem] font-semibold leading-tight text-zinc-50">
            {competition.name}
          </h3>
        </div>

        <dl className="grid gap-3.5 pt-1">
          <div className="grid gap-1">
            <dt className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              Deadline pendaftaran
            </dt>
            <dd className="text-[1.18rem] font-semibold leading-tight text-zinc-100">
              {formatDate(competition.regEnd)}
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              Penyisihan
            </dt>
            <dd className="text-[1.02rem] font-medium leading-relaxed text-zinc-100">
              {formatDateRange(competition.eventStart, competition.eventEnd)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1">
            <dt className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              Sisa waktu
            </dt>
            <dd className="text-[1.03rem] font-semibold text-accent-gold/95">
              {daysLeftLabel}
            </dd>
          </div>
        </dl>

        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[0.95rem] font-medium text-zinc-300">
            Lihat detail
          </span>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700/70 text-zinc-400 transition group-hover:border-zinc-500 group-hover:text-zinc-200">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M5.25 3L9.25 7L5.25 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </button>
  );
}
