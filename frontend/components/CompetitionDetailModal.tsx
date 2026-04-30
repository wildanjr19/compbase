"use client";

import { ShareButton } from "@/components/ShareButton";
import { StatusBadge } from "@/components/StatusBadge";
import type { Competition } from "@/lib/types";
import {
  formatDate,
  formatDateRange,
  getCompetitionStatus,
  getDaysUntilDeadline,
} from "@/lib/utils/competitions";

interface CompetitionDetailModalProps {
  competition: Competition;
  now: Date;
  onClose: () => void;
}

interface ActionLink {
  label: string;
  href: string;
}

function getWebsiteLink(competition: Competition): string | undefined {
  return competition.links.website ?? competition.links.linktree ?? competition.links.registration;
}

function createActionLinks(competition: Competition): ActionLink[] {
  const links: ActionLink[] = [];
  const websiteLink = competition.links.website ?? competition.links.linktree;

  if (competition.links.registration) {
    links.push({ label: "Registrasi", href: competition.links.registration });
  }

  if (competition.links.guidebook) {
    links.push({ label: "Guidebook", href: competition.links.guidebook });
  }

  if (competition.links.instagram) {
    links.push({ label: "Instagram", href: competition.links.instagram });
  }

  if (websiteLink) {
    links.push({ label: "Website", href: websiteLink });
  }

  return links;
}

function formatShareValue(value: string | undefined): string {
  return value ?? "-";
}

export function CompetitionDetailModal({
  competition,
  now,
  onClose,
}: CompetitionDetailModalProps) {
  const status = getCompetitionStatus(competition, now);
  const daysLeft = getDaysUntilDeadline(competition.regEnd, now);
  const websiteLink = getWebsiteLink(competition);
  const actionLinks = createActionLinks(competition);
  const shareText = [
    `[${competition.name}]`,
    "",
    `Registrasi: ${formatDateRange(competition.regStart, competition.regEnd)}`,
    `Penyisihan: ${formatDateRange(competition.eventStart, competition.eventEnd)}`,
    `Guidebook: ${formatShareValue(competition.links.guidebook)}`,
    `Instagram: ${formatShareValue(competition.links.instagram)}`,
    `Website: ${formatShareValue(websiteLink)}`,
  ].join("\n");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup detail lomba"
        className="absolute inset-0 bg-[oklch(0.13_0.02_286_/_0.78)] backdrop-blur-md"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[1.6rem] border border-white/7 bg-surface-2/90 shadow-[0_36px_110px_-56px_oklch(0.02_0.03_286)] backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-4 px-5 py-5 md:px-6 md:py-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
            </div>

            <div>
              <p className="text-[13px] text-zinc-400">
                {competition.category} | {competition.organizer}
              </p>
              <h3 className="mt-1.5 font-brand text-[clamp(1.55rem,3.4vw,2.35rem)] leading-[1.04] text-zinc-50">
                {competition.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-zinc-300 hover:border-white/18 hover:text-zinc-50"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="grid gap-4 px-5 pb-5 pt-0 md:px-6 md:pb-6">
          <dl className="grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-[1rem] bg-black/12 p-3.5 text-[13px] text-zinc-300 ring-1 ring-white/6">
              <dt className="text-xs uppercase tracking-[0.22em] text-zinc-500">Deadline pendaftaran</dt>
              <dd className="mt-1.5 text-sm font-medium text-zinc-100">{formatDate(competition.regEnd)}</dd>
              <dd className="mt-1 text-xs text-zinc-400">
                {daysLeft === null
                  ? "Tanggal belum ditentukan"
                  : daysLeft === 0
                    ? "Hari terakhir"
                  : daysLeft >= 0
                    ? `Masih ada ${daysLeft} hari`
                    : "Pendaftaran sudah tutup"}
              </dd>
            </div>
            <div className="rounded-[1rem] bg-black/12 p-3.5 text-[13px] text-zinc-300 ring-1 ring-white/6">
              <dt className="text-xs uppercase tracking-[0.22em] text-zinc-500">Penyisihan</dt>
              <dd className="mt-1.5 font-medium leading-relaxed text-zinc-100">
                {formatDateRange(competition.eventStart, competition.eventEnd)}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            <ShareButton shareText={shareText} />

            {actionLinks.map((item) => (
              <a
                key={`${item.label}-${item.href}`}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/9 bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200 hover:border-violet-200/20 hover:text-violet-100"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
