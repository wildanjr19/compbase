import type { CompetitionStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: CompetitionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "open") {
    return (
      <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-accent-emerald/28 bg-accent-emerald/8 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-emerald">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        Masih Buka
      </span>
    );
  }

  if (status === "closing-soon") {
    return (
      <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-accent-gold/32 bg-accent-gold/8 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-gold">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        Deadline Dekat
      </span>
    );
  }

  return (
    <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-rose-300/28 bg-rose-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-100">
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      Sudah Tutup
    </span>
  );
}
