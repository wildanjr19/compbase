import type { RefObject } from "react";
import {
  CATEGORY_OPTIONS,
  MAX_PRIORITY_COMPETITIONS,
  countActiveLinks,
  getStatusLabel,
  type EditableCompetitionField,
  type EditableCompetitionLink,
} from "@/components/admin/AdminCompetitionManager.utils";
import type { Competition } from "@/lib/types";
import { formatDateRange, getCompetitionStatus } from "@/lib/utils/competitions";

interface AdminCompetitionEditorPanelProps {
  selectedCompetition: Competition | null;
  selectedValidationErrors: string[];
  selectedPriorityOrder: number | null;
  isSingleEventDate: boolean;
  isMutationPending: boolean;
  priorityCompetitionsCount: number;
  hasUnsavedChanges: boolean;
  saveMessage: string;
  now: Date;
  editorPanelRef: RefObject<HTMLElement | null>;
  regStartInputRef: RefObject<HTMLInputElement | null>;
  regEndInputRef: RefObject<HTMLInputElement | null>;
  eventStartInputRef: RefObject<HTMLInputElement | null>;
  eventEndInputRef: RefObject<HTMLInputElement | null>;
  onFieldChange: (field: EditableCompetitionField, value: string) => void;
  onLinkChange: (field: EditableCompetitionLink, value: string) => void;
  onSave: () => void;
  onAddCompetition: () => void;
  onDuplicateCompetition: () => void;
  onResetDraft: () => void;
  onDeleteCompetition: () => void;
  onTogglePriority: () => void;
  onEventDateModeChange: (mode: "single" | "range") => void;
  openDatePicker: (inputElement: HTMLInputElement | null) => void;
}

export function AdminCompetitionEditorPanel({
  selectedCompetition,
  selectedValidationErrors,
  selectedPriorityOrder,
  isSingleEventDate,
  isMutationPending,
  priorityCompetitionsCount,
  hasUnsavedChanges,
  saveMessage,
  now,
  editorPanelRef,
  regStartInputRef,
  regEndInputRef,
  eventStartInputRef,
  eventEndInputRef,
  onFieldChange,
  onLinkChange,
  onSave,
  onAddCompetition,
  onDuplicateCompetition,
  onResetDraft,
  onDeleteCompetition,
  onTogglePriority,
  onEventDateModeChange,
  openDatePicker,
}: AdminCompetitionEditorPanelProps) {
  return (
    <section
      ref={editorPanelRef}
      className="rounded-[1.55rem] border border-white/10 bg-[oklch(0.16_0.02_250_/_0.88)] p-5 backdrop-blur-2xl sm:p-6"
    >
      {selectedCompetition ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-5 border-b border-white/8 pb-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Editor kompetisi
                </p>
                <h2 className="mt-2 font-brand text-[1.75rem] leading-tight text-zinc-50 sm:text-[2rem]">
                  {selectedCompetition.name}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={isMutationPending}
                  onClick={onAddCompetition}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-amber-200 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Tambah kompetisi
                </button>
                <button
                  type="button"
                  disabled={isMutationPending}
                  onClick={onDuplicateCompetition}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 px-5 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Duplikasi
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={isMutationPending}
                onClick={onSave}
                className="inline-flex h-11 items-center justify-center rounded-full bg-amber-200 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isMutationPending ? "Menyimpan..." : "Simpan perubahan"}
              </button>
              <button
                type="button"
                disabled={isMutationPending}
                onClick={onResetDraft}
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 px-5 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Reset draft
              </button>
              <button
                type="button"
                disabled={isMutationPending}
                onClick={onDeleteCompetition}
                className="inline-flex h-11 items-center justify-center rounded-full border border-rose-300/20 px-5 text-sm font-medium text-rose-100 transition hover:border-rose-300/32 hover:bg-rose-300/10 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isMutationPending ? "Memproses..." : "Hapus kompetisi"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
            <div className="rounded-[1.15rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
              {isMutationPending
                ? "Sedang menyinkronkan perubahan ke backend..."
                : saveMessage}
            </div>
            <div className="rounded-[1.15rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
              <div className="flex items-center justify-between gap-3">
                <span>Status perubahan</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    isMutationPending
                      ? "bg-sky-300/12 text-sky-100"
                      : hasUnsavedChanges
                        ? "bg-amber-300/12 text-amber-100"
                        : "bg-emerald-300/12 text-emerald-100"
                  }`}
                >
                  {isMutationPending
                    ? "Sinkronisasi"
                    : hasUnsavedChanges
                      ? "Belum disimpan"
                      : "Tersimpan"}
                </span>
              </div>
            </div>
          </div>

          <section className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  Pilihan cepat
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  Prioritas {priorityCompetitionsCount}/{MAX_PRIORITY_COMPETITIONS}
                  {selectedPriorityOrder ? ` • Urutan ${selectedPriorityOrder}` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={
                  isMutationPending ||
                  (!selectedCompetition.isPriority &&
                    priorityCompetitionsCount >= MAX_PRIORITY_COMPETITIONS)
                }
                onClick={onTogglePriority}
                className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70 ${
                  selectedCompetition.isPriority
                    ? "border-sky-300/24 bg-sky-300/14 text-sky-100 hover:border-sky-300/32 hover:bg-sky-300/20"
                    : "border-white/10 bg-white/[0.03] text-zinc-100 hover:border-white/20 hover:bg-white/[0.05]"
                }`}
              >
                {selectedCompetition.isPriority
                  ? "Hapus dari prioritas"
                  : "Jadikan prioritas"}
              </button>
            </div>
          </section>

          {selectedValidationErrors.length > 0 ? (
            <section className="rounded-[1.25rem] border border-rose-300/16 bg-rose-300/10 p-4 text-sm text-rose-50">
              <p className="font-medium">
                Data ini masih perlu dirapikan sebelum disimpan:
              </p>
              <ul className="mt-3 grid gap-2 text-rose-100/90">
                {selectedValidationErrors.map((errorMessage) => (
                  <li key={errorMessage}>• {errorMessage}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="grid gap-6">
            <section className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-zinc-200">Nama kompetisi</span>
                <input
                  type="text"
                  value={selectedCompetition.name}
                  onChange={(event) => onFieldChange("name", event.target.value)}
                  className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-zinc-200">Penyelenggara</span>
                <input
                  type="text"
                  value={selectedCompetition.organizer}
                  onChange={(event) =>
                    onFieldChange("organizer", event.target.value)
                  }
                  className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-zinc-200">Kategori</span>
                <div className="relative">
                  <select
                    value={selectedCompetition.category}
                    onChange={(event) => onFieldChange("category", event.target.value)}
                    className="h-11 w-full appearance-none rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 pr-12 text-zinc-100 outline-none ring-amber-200/30 focus:ring [&>option]:bg-zinc-50 [&>option]:text-zinc-950"
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-zinc-400">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 6.25L8 10.25L12 6.25"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-zinc-200">Slug</span>
                <input
                  type="text"
                  value={selectedCompetition.slug}
                  readOnly
                  className="h-11 rounded-[1rem] border border-white/10 bg-black/20 px-4 text-zinc-400 outline-none"
                />
              </label>
            </section>

            <section className="grid gap-4 rounded-[1.3rem] border border-white/8 bg-white/[0.025] p-4 sm:p-5 lg:grid-cols-2">
              <div className="flex items-start justify-between gap-3 lg:col-span-2">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Jadwal utama
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onEventDateModeChange(isSingleEventDate ? "range" : "single")
                  }
                  title={
                    isSingleEventDate
                      ? "Mode saat ini: satu tanggal. Klik untuk ubah ke rentang."
                      : "Mode saat ini: rentang tanggal. Klik untuk ubah ke satu tanggal."
                  }
                  aria-label={
                    isSingleEventDate
                      ? "Ubah mode penyisihan ke rentang tanggal"
                      : "Ubah mode penyisihan ke satu tanggal"
                  }
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-[0.7rem] border transition ${
                    isSingleEventDate
                      ? "border-amber-200/26 bg-amber-200/14 text-amber-100"
                      : "border-sky-200/24 bg-sky-200/12 text-sky-100"
                  }`}
                >
                  {isSingleEventDate ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="7.5"
                        cy="7.5"
                        r="4.25"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect
                        x="2.25"
                        y="3.25"
                        width="10.5"
                        height="8.5"
                        rx="2.2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M7.5 3.5V11.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </button>
              </div>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-zinc-200">Buka registrasi</span>
                <div className="relative">
                  <input
                    ref={regStartInputRef}
                    type="date"
                    value={selectedCompetition.regStart}
                    onChange={(event) => onFieldChange("regStart", event.target.value)}
                    className="h-11 w-full appearance-none rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 pr-11 text-zinc-100 outline-none ring-amber-200/30 focus:ring [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                  />
                  <button
                    type="button"
                    onClick={() => openDatePicker(regStartInputRef.current)}
                    aria-label="Buka kalender tanggal buka registrasi"
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-zinc-300 transition hover:text-zinc-100"
                  >
                    <CalendarIcon />
                  </button>
                </div>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-zinc-200">Tutup registrasi</span>
                <div className="relative">
                  <input
                    ref={regEndInputRef}
                    type="date"
                    value={selectedCompetition.regEnd}
                    onChange={(event) => onFieldChange("regEnd", event.target.value)}
                    className="h-11 w-full appearance-none rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 pr-11 text-zinc-100 outline-none ring-amber-200/30 focus:ring [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                  />
                  <button
                    type="button"
                    onClick={() => openDatePicker(regEndInputRef.current)}
                    aria-label="Buka kalender tanggal tutup registrasi"
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-zinc-300 transition hover:text-zinc-100"
                  >
                    <CalendarIcon />
                  </button>
                </div>
              </label>

              <label
                className={`grid gap-2 text-sm ${isSingleEventDate ? "sm:col-span-2" : ""}`}
              >
                <span className="font-medium text-zinc-200">
                  {isSingleEventDate ? "Tanggal penyisihan" : "Mulai penyisihan"}
                </span>
                <div className="relative">
                  <input
                    ref={eventStartInputRef}
                    type="date"
                    value={selectedCompetition.eventStart}
                    onChange={(event) =>
                      onFieldChange("eventStart", event.target.value)
                    }
                    className="h-11 w-full appearance-none rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 pr-11 text-zinc-100 outline-none ring-amber-200/30 focus:ring [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                  />
                  <button
                    type="button"
                    onClick={() => openDatePicker(eventStartInputRef.current)}
                    aria-label="Buka kalender tanggal mulai penyisihan"
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-zinc-300 transition hover:text-zinc-100"
                  >
                    <CalendarIcon />
                  </button>
                </div>
              </label>

              {isSingleEventDate ? null : (
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-zinc-200">
                    Selesai penyisihan
                  </span>
                  <div className="relative">
                    <input
                      ref={eventEndInputRef}
                      type="date"
                      value={selectedCompetition.eventEnd}
                      onChange={(event) =>
                        onFieldChange("eventEnd", event.target.value)
                      }
                      className="h-11 w-full appearance-none rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 pr-11 text-zinc-100 outline-none ring-amber-200/30 focus:ring [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                    />
                    <button
                      type="button"
                      onClick={() => openDatePicker(eventEndInputRef.current)}
                      aria-label="Buka kalender tanggal selesai penyisihan"
                      className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-zinc-300 transition hover:text-zinc-100"
                    >
                      <CalendarIcon />
                    </button>
                  </div>
                </label>
              )}
            </section>

            <section className="grid gap-4 rounded-[1.3rem] border border-white/8 bg-white/[0.025] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    Tautan kompetisi
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-zinc-50">
                    Perbarui link penting
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-xs font-semibold uppercase tracking-wide text-zinc-300">
                    {countActiveLinks(selectedCompetition)} link aktif
                  </span>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-zinc-200">Link registrasi</span>
                  <input
                    type="url"
                    value={selectedCompetition.links.registration ?? ""}
                    onChange={(event) =>
                      onLinkChange("registration", event.target.value)
                    }
                    className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                  />
                </label>

                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-zinc-200">Link guidebook</span>
                  <input
                    type="url"
                    value={selectedCompetition.links.guidebook ?? ""}
                    onChange={(event) => onLinkChange("guidebook", event.target.value)}
                    className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                  />
                </label>

                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-zinc-200">Instagram</span>
                  <input
                    type="url"
                    value={selectedCompetition.links.instagram ?? ""}
                    onChange={(event) => onLinkChange("instagram", event.target.value)}
                    className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                  />
                </label>

                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-zinc-200">Linktree</span>
                  <input
                    type="url"
                    value={selectedCompetition.links.linktree ?? ""}
                    onChange={(event) => onLinkChange("linktree", event.target.value)}
                    className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                  />
                </label>

                <label className="grid gap-2 text-sm lg:col-span-2">
                  <span className="font-medium text-zinc-200">Website resmi</span>
                  <input
                    type="url"
                    value={selectedCompetition.links.website ?? ""}
                    onChange={(event) => onLinkChange("website", event.target.value)}
                    className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                  />
                </label>
              </div>
            </section>

            <section className="grid gap-4 rounded-[1.3rem] border border-white/8 bg-white/[0.025] p-4 sm:p-5 lg:grid-cols-3">
              <div className="rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  Status
                </p>
                <p className="mt-2 text-base font-semibold text-zinc-50">
                  {getStatusLabel(getCompetitionStatus(selectedCompetition, now))}
                </p>
              </div>
              <div className="rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  Pendaftaran
                </p>
                <p className="mt-2 text-sm font-medium text-zinc-100">
                  {formatDateRange(
                    selectedCompetition.regStart,
                    selectedCompetition.regEnd,
                  )}
                </p>
              </div>
              <div className="rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  Penyisihan
                </p>
                <p className="mt-2 text-sm font-medium text-zinc-100">
                  {formatDateRange(
                    selectedCompetition.eventStart,
                    selectedCompetition.eventEnd,
                  )}
                </p>
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="rounded-[1.3rem] border border-dashed border-white/10 px-5 py-12 text-center text-sm text-zinc-400">
          Belum ada kompetisi yang dipilih untuk diedit.
        </div>
      )}
    </section>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 1.75V3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 1.75V3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect
        x="2.5"
        y="2.75"
        width="11"
        height="10.75"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M2.5 5.75H13.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
