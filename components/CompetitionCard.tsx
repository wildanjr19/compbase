"use client";

import { useState } from "react";
import { CompetitionDetailModal } from "@/components/CompetitionDetailModal";
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
}

export function CompetitionCard({ competition, now }: CompetitionCardProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const status = getCompetitionStatus(competition, now);
  const daysLeft = getDaysUntilDeadline(competition.regEnd, now);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group w-full rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 text-left shadow-lg shadow-zinc-950/60 transition hover:-translate-y-1 hover:border-zinc-600"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              {competition.organizer}
            </p>
            <h3 className="mt-2 text-2xl font-semibold leading-tight text-zinc-50">
              {competition.name}
            </h3>
          </div>
          {competition.isPriority ? (
            <span className="rounded-full border border-amber-300/40 bg-amber-300/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-100">
              Prioritas
            </span>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
        </div>

        <dl className="mt-5 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
            <dt className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Batas Registrasi
            </dt>
            <dd className="mt-2 font-medium text-zinc-100">
              {formatDate(competition.regEnd)}
            </dd>
            <dd className="mt-1 text-xs text-zinc-400">
              {daysLeft >= 0 ? `${daysLeft} hari lagi` : "Sudah lewat"}
            </dd>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
            <dt className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Rentang Event
            </dt>
            <dd className="mt-2 font-medium text-zinc-100">
              {formatDateRange(competition.eventStart, competition.eventEnd)}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex items-center justify-end gap-2 text-sm text-zinc-300">
          Lihat detail
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
      </button>

      <CompetitionDetailModal
        competition={competition}
        now={now}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
