import type { CompetitionStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: CompetitionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "open") {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-300/40 bg-emerald-300/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100">
        Masih Buka
      </span>
    );
  }

  if (status === "closing-soon") {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-300/40 bg-amber-300/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-100">
        Deadline Dekat
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-zinc-500/50 bg-zinc-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-200">
      Ditutup
    </span>
  );
}