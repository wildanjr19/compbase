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
  const isLeadCard = index === 0;
  const competitionOrder = String(index + 1).padStart(2, "0");
  const daysLeftLabel = getRemainingDaysLabel(daysLeft);

  if (isLeadCard) {
    return (
      <button
        type="button"
        onClick={() => onOpenDetail(competition)}
        className="group soft-panel block w-full overflow-hidden rounded-[1.3rem] border border-line-soft/80 bg-surface-1/26 text-left hover:border-zinc-400/70"
      >
        <div className="lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
          <div className="grid gap-4 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusBadge status={status} />
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-400">
                #{competitionOrder}
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                {competition.category} | {competition.organizer}
              </p>
              <h3 className="font-brand text-[clamp(1.85rem,3.2vw,2.8rem)] leading-[1.03] text-zinc-50">
                {competition.name}
              </h3>
            </div>
          </div>

          <div className="grid content-start gap-3 p-5 md:p-6">
            <dl className="grid gap-2 rounded-[1rem] bg-white/[0.03] p-3.5">
              <dt className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                Deadline pendaftaran
              </dt>
              <dd className="text-base font-semibold text-zinc-100">
                {formatDate(competition.regEnd)}
              </dd>
              <dd className="text-xs text-zinc-400">{daysLeftLabel}</dd>
            </dl>

            <dl className="grid gap-2 rounded-[1rem] bg-white/[0.03] p-3.5">
              <dt className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                Periode penyisihan
              </dt>
              <dd className="text-sm font-medium leading-relaxed text-zinc-100">
                {formatDateRange(competition.eventStart, competition.eventEnd)}
              </dd>
            </dl>

            <div className="flex items-center justify-between pt-2.5">
              <span className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                Buka detail
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700/70 text-zinc-400 transition group-hover:border-zinc-500 group-hover:text-zinc-200">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M5.25 3L9.25 7L5.25 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpenDetail(competition)}
      className="group soft-panel block w-full overflow-hidden rounded-[1.2rem] border border-line-soft/80 bg-surface-1/24 text-left hover:border-zinc-500/70"
    >
      <div className="grid gap-4 p-4 md:p-[1.125rem]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status={status} />
          <span className="text-xs uppercase tracking-[0.22em] text-zinc-600">
            #{competitionOrder}
          </span>
        </div>

        <div>
          <p className="text-[13px] text-zinc-400">
            {competition.category} | {competition.organizer}
          </p>
          <h3 className="mt-1.5 text-[1.2rem] font-semibold leading-tight text-zinc-50">
            {competition.name}
          </h3>
        </div>

        <dl className="grid gap-2.5 pt-1 text-sm text-zinc-300">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Deadline
            </dt>
            <dd className="text-right font-medium text-zinc-100">
              {formatDate(competition.regEnd)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Penyisihan
            </dt>
            <dd className="text-right font-medium text-zinc-200">
              {formatDateRange(competition.eventStart, competition.eventEnd)}
            </dd>
          </div>
        </dl>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs uppercase tracking-[0.24em] text-zinc-600">
            Lihat detail
          </span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700/70 text-zinc-400 transition group-hover:border-zinc-500 group-hover:text-zinc-200">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M5.25 3L9.25 7L5.25 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </button>
  );
}
