import type { Competition } from "@/lib/types";
import { formatDate, getCompetitionStatus } from "@/lib/utils/competitions";
import {
  getStatusClassName,
  getStatusLabel,
  toAdminCompetitionStatusFilter,
  validateCompetition,
  type AdminCompetitionStatusFilter,
} from "@/components/admin/AdminCompetitionManager.utils";

interface AdminCompetitionListPanelProps {
  competitions: Competition[];
  filteredCompetitions: Competition[];
  selectedCompetition: Competition | null;
  now: Date;
  isMutationPending: boolean;
  searchValue: string;
  categoryFilterValue: string;
  statusFilterValue: AdminCompetitionStatusFilter;
  availableCategoryFilters: string[];
  priorityOrderByCompetitionId: Map<string, number>;
  syncedListMaxHeight: number | null;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onStatusFilterChange: (value: AdminCompetitionStatusFilter) => void;
  onAddCompetition: () => void;
  onSelectCompetition: (competitionId: string) => void;
}

export function AdminCompetitionListPanel({
  competitions,
  filteredCompetitions,
  selectedCompetition,
  now,
  isMutationPending,
  searchValue,
  categoryFilterValue,
  statusFilterValue,
  availableCategoryFilters,
  priorityOrderByCompetitionId,
  syncedListMaxHeight,
  onSearchChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onAddCompetition,
  onSelectCompetition,
}: AdminCompetitionListPanelProps) {
  return (
    <aside
      style={
        syncedListMaxHeight ? { maxHeight: `${syncedListMaxHeight}px` } : undefined
      }
      className="flex max-h-[70vh] min-h-0 flex-col rounded-[1.55rem] border border-white/10 bg-[oklch(0.16_0.02_250_/_0.88)] p-5 backdrop-blur-2xl xl:max-h-none sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-white/8 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              Daftar kompetisi
            </p>
            <h2 className="mt-2 font-brand text-[1.75rem] leading-tight text-zinc-50 sm:text-[1.95rem]">
              Pilih data yang ingin diperbarui
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isMutationPending}
              onClick={onAddCompetition}
              className="inline-flex h-9 items-center justify-center rounded-full bg-amber-200 px-4 text-xs font-semibold uppercase tracking-wide text-zinc-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Tambah kompetisi
            </button>
            <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
              {filteredCompetitions.length} dari {competitions.length} data
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-zinc-200">Cari kompetisi</span>
            <input
              type="text"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cari nama, penyelenggara, atau kategori"
              className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 placeholder:text-zinc-500 focus:ring"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-zinc-200">Filter kategori</span>
              <select
                value={categoryFilterValue}
                onChange={(event) => onCategoryFilterChange(event.target.value)}
                className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring [&>option]:bg-zinc-900 [&>option]:text-zinc-100"
              >
                <option value="all">Semua kategori</option>
                {availableCategoryFilters.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium text-zinc-200">Filter status</span>
              <select
                value={statusFilterValue}
                onChange={(event) =>
                  onStatusFilterChange(
                    toAdminCompetitionStatusFilter(event.target.value),
                  )
                }
                className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring [&>option]:bg-zinc-900 [&>option]:text-zinc-100"
              >
                <option value="all">Semua status</option>
                <option value="open">Masih buka</option>
                <option value="coming-soon">Coming Soon</option>
                <option value="closed">Sudah tutup</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="subtle-scrollbar mt-5 min-h-0 flex-1 overflow-y-auto pr-2">
        <div className="grid gap-3">
          {filteredCompetitions.map((competition) => {
            const status = getCompetitionStatus(competition, now);
            const isActive = competition.id === selectedCompetition?.id;
            const validationErrors = validateCompetition(competition);

            return (
              <button
                key={competition.id}
                type="button"
                onClick={() => onSelectCompetition(competition.id)}
                className={`rounded-[1.2rem] border p-4 text-left transition ${
                  isActive
                    ? "border-amber-200/24 bg-amber-200/10 shadow-[0_18px_38px_-32px_oklch(0.82_0.07_85)]"
                    : "border-white/8 bg-white/[0.025] hover:border-white/16 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-zinc-100 sm:text-sm">
                      {competition.name}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {competition.organizer}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${getStatusClassName(
                        status,
                      )}`}
                    >
                      {getStatusLabel(status)}
                    </span>
                    {competition.isPriority ? (
                      <span className="inline-flex rounded-full border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-100">
                        Prioritas {priorityOrderByCompetitionId.get(competition.id)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                  <span>{competition.category}</span>
                  <span>Deadline {formatDate(competition.regEnd)}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {validationErrors.length > 0 ? (
                    <span className="rounded-full border border-rose-300/18 bg-rose-300/10 px-2.5 py-1 text-[11px] text-rose-100">
                      {validationErrors.length} catatan
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}

          {filteredCompetitions.length === 0 ? (
            <div className="rounded-[1.2rem] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-400">
              Tidak ada data yang cocok dengan pencarian saat ini.
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
