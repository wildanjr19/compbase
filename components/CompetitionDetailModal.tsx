"use client";

import { useRef, useState } from "react";
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
  isOpen: boolean;
  onClose: () => void;
}

interface ActionLink {
  label: string;
  href: string;
}

type CopyState = "idle" | "success" | "error";

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
  isOpen,
  onClose,
}: CompetitionDetailModalProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimerRef = useRef<number | null>(null);

  if (!isOpen) {
    return null;
  }

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

  const handleShare = async (): Promise<void> => {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard tidak tersedia.");
      }

      await navigator.clipboard.writeText(shareText);
      setCopyState("success");
    } catch {
      setCopyState("error");
    }

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setCopyState("idle");
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Tutup detail lomba"
        className="absolute inset-0 bg-[oklch(0.12_0.02_270_/_0.78)] backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[1.6rem] border border-white/10 bg-zinc-950/88 shadow-[0_36px_110px_-56px_oklch(0.02_0.03_286)] backdrop-blur-2xl">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/30 to-transparent" />

        <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-5 md:px-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              {competition.hasGuidebook ? (
                <span className="rounded-full border border-emerald-300/24 bg-emerald-300/8 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                  Ada guidebook
                </span>
              ) : null}
              {competition.isPriority ? (
                <span className="rounded-full border border-violet-200/24 bg-violet-200/8 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-100">
                  Prioritas
                </span>
              ) : null}
            </div>

            <div>
              <p className="text-sm text-zinc-400">{competition.organizer}</p>
              <h3 className="mt-2 font-brand text-[clamp(1.85rem,4vw,3rem)] leading-tight text-zinc-50">
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

        <div className="grid gap-5 px-5 py-5 md:px-6 md:py-6">
          <p className="text-sm leading-relaxed text-zinc-300">{competition.description}</p>

          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1rem] border border-white/8 bg-black/12 p-4 text-sm text-zinc-300">
              <dt className="text-xs uppercase tracking-[0.22em] text-zinc-500">Deadline</dt>
              <dd className="mt-2 font-medium text-zinc-100">{formatDate(competition.regEnd)}</dd>
              <dd className="mt-1 text-xs text-zinc-400">
                {daysLeft >= 0 ? `Masih ada ${daysLeft} hari` : "Pendaftaran sudah tutup"}
              </dd>
            </div>
            <div className="rounded-[1rem] border border-white/8 bg-black/12 p-4 text-sm text-zinc-300">
              <dt className="text-xs uppercase tracking-[0.22em] text-zinc-500">Penyisihan</dt>
              <dd className="mt-2 font-medium leading-relaxed text-zinc-100">
                {formatDateRange(competition.eventStart, competition.eventEnd)}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="rounded-full border border-violet-200/18 bg-violet-200/8 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-violet-100 hover:border-violet-200/28 hover:bg-violet-200/12"
            >
              Bagikan
            </button>

            {actionLinks.map((item) => (
              <a
                key={`${item.label}-${item.href}`}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200 hover:border-violet-200/20 hover:text-violet-100"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-5" aria-live="polite">
          {copyState === "success" ? (
            <div className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-4 py-2 text-xs font-medium text-emerald-100 shadow-[0_18px_50px_-30px_oklch(0.7_0.06_160)] backdrop-blur-md">
              Informasi lomba berhasil disalin
            </div>
          ) : null}

          {copyState === "error" ? (
            <div className="rounded-full border border-rose-300/18 bg-rose-300/10 px-4 py-2 text-xs font-medium text-rose-100 shadow-[0_18px_50px_-30px_oklch(0.62_0.06_20)] backdrop-blur-md">
              Gagal menyalin informasi lomba
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
