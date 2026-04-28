import type { CompetitionStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: CompetitionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "coming-soon") {
    return (
      <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-sky-300/28 bg-sky-300/10 px-3.5 py-1 text-sm font-semibold uppercase tracking-wide text-sky-100">
        <span className="h-2 w-2 rounded-full bg-current" />
        Coming Soon
      </span>
    );
  }

  if (status === "open") {
    return (
      <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-accent-emerald/28 bg-accent-emerald/8 px-3.5 py-1 text-sm font-semibold uppercase tracking-wide text-accent-emerald">
        <span className="h-2 w-2 rounded-full bg-current" />
        Masih Buka
      </span>
    );
  }

  return (
    <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-rose-300/28 bg-rose-300/10 px-3.5 py-1 text-sm font-semibold uppercase tracking-wide text-rose-100">
      <span className="h-2 w-2 rounded-full bg-current" />
      Sudah Tutup
    </span>
  );
}
