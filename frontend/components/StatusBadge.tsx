import type { CompetitionStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: CompetitionStatus;
  compact?: boolean;
}

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const sizeClassName = compact
    ? "min-h-8 gap-1.5 px-3 py-0.5 text-[0.72rem] tracking-[0.11em]"
    : "min-h-9 gap-2 px-3.5 py-1 text-sm tracking-wide";
  const dotClassName = compact ? "h-1.5 w-1.5" : "h-2 w-2";

  if (status === "coming-soon") {
    return (
      <span className={`inline-flex items-center rounded-full border border-sky-300/28 bg-sky-300/10 font-semibold uppercase text-sky-100 ${sizeClassName}`}>
        <span className={`rounded-full bg-current ${dotClassName}`} />
        Coming Soon
      </span>
    );
  }

  if (status === "open") {
    return (
      <span className={`inline-flex items-center rounded-full border border-accent-emerald/28 bg-accent-emerald/8 font-semibold uppercase text-accent-emerald ${sizeClassName}`}>
        <span className={`rounded-full bg-current ${dotClassName}`} />
        Masih Buka
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full border border-rose-300/28 bg-rose-300/10 font-semibold uppercase text-rose-100 ${sizeClassName}`}>
      <span className={`rounded-full bg-current ${dotClassName}`} />
      Sudah Tutup
    </span>
  );
}
