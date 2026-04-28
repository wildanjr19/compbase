import type { RefObject } from "react";
import { AdminCompetitionEditorPanel } from "@/components/admin/AdminCompetitionEditorPanel";
import { AdminCompetitionListPanel } from "@/components/admin/AdminCompetitionListPanel";
import type {
  AdminCompetitionStatusFilter,
  EditableCompetitionField,
  EditableCompetitionLink,
} from "@/components/admin/AdminCompetitionManager.utils";
import type { Competition } from "@/lib/types";

interface AdminCompetitionWorkspaceProps {
  competitions: Competition[];
  filteredCompetitions: Competition[];
  selectedCompetition: Competition | null;
  selectedValidationErrors: string[];
  selectedPriorityOrder: number | null;
  isSingleEventDate: boolean;
  now: Date;
  isMutationPending: boolean;
  dataStatusMessage?: string | null;
  openCompetitions: number;
  comingSoonCompetitions: number;
  closedCompetitions: number;
  searchValue: string;
  categoryFilterValue: string;
  statusFilterValue: AdminCompetitionStatusFilter;
  availableCategoryFilters: string[];
  priorityOrderByCompetitionId: Map<string, number>;
  syncedListMaxHeight: number | null;
  priorityCompetitionsCount: number;
  hasUnsavedChanges: boolean;
  saveMessage: string;
  regStartInputRef: RefObject<HTMLInputElement | null>;
  regEndInputRef: RefObject<HTMLInputElement | null>;
  eventStartInputRef: RefObject<HTMLInputElement | null>;
  eventEndInputRef: RefObject<HTMLInputElement | null>;
  editorPanelRef: RefObject<HTMLElement | null>;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onStatusFilterChange: (value: AdminCompetitionStatusFilter) => void;
  onAddCompetition: () => void;
  onSelectCompetition: (competitionId: string) => void;
  onFieldChange: (field: EditableCompetitionField, value: string) => void;
  onLinkChange: (field: EditableCompetitionLink, value: string) => void;
  onSave: () => void;
  onDuplicateCompetition: () => void;
  onResetDraft: () => void;
  onDeleteCompetition: () => void;
  onTogglePriority: () => void;
  onEventDateModeChange: (mode: "single" | "range") => void;
  openDatePicker: (inputElement: HTMLInputElement | null) => void;
}

export function AdminCompetitionWorkspace({
  competitions,
  filteredCompetitions,
  selectedCompetition,
  selectedValidationErrors,
  selectedPriorityOrder,
  isSingleEventDate,
  now,
  isMutationPending,
  dataStatusMessage = null,
  openCompetitions,
  comingSoonCompetitions,
  closedCompetitions,
  searchValue,
  categoryFilterValue,
  statusFilterValue,
  availableCategoryFilters,
  priorityOrderByCompetitionId,
  syncedListMaxHeight,
  priorityCompetitionsCount,
  hasUnsavedChanges,
  saveMessage,
  regStartInputRef,
  regEndInputRef,
  eventStartInputRef,
  eventEndInputRef,
  editorPanelRef,
  onSearchChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onAddCompetition,
  onSelectCompetition,
  onFieldChange,
  onLinkChange,
  onSave,
  onDuplicateCompetition,
  onResetDraft,
  onDeleteCompetition,
  onTogglePriority,
  onEventDateModeChange,
  openDatePicker,
}: AdminCompetitionWorkspaceProps) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-center backdrop-blur-md">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
            Total data
          </p>
          <p className="mt-2 text-[1.8rem] font-semibold text-zinc-50 sm:text-[2rem]">
            {competitions.length}
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-emerald-300/18 bg-emerald-300/10 px-5 py-4 text-center backdrop-blur-md">
          <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-100/75">
            Masih buka
          </p>
          <p className="mt-2 text-[1.8rem] font-semibold text-emerald-50 sm:text-[2rem]">
            {openCompetitions}
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-sky-300/18 bg-sky-300/10 px-5 py-4 text-center backdrop-blur-md">
          <p className="text-[11px] uppercase tracking-[0.22em] text-sky-100/75">
            Coming Soon
          </p>
          <p className="mt-2 text-[1.8rem] font-semibold text-sky-50 sm:text-[2rem]">
            {comingSoonCompetitions}
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-rose-300/18 bg-rose-300/10 px-5 py-4 text-center backdrop-blur-md">
          <p className="text-[11px] uppercase tracking-[0.22em] text-rose-100/75">
            Sudah tutup
          </p>
          <p className="mt-2 text-[1.8rem] font-semibold text-rose-50 sm:text-[2rem]">
            {closedCompetitions}
          </p>
        </div>
      </section>

      {dataStatusMessage ? (
        <section className="rounded-[1.25rem] border border-amber-200/14 bg-amber-200/8 px-4 py-3 text-sm text-amber-50 backdrop-blur-md sm:px-5">
          <p>{dataStatusMessage}</p>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.35fr)] xl:items-start">
        <AdminCompetitionListPanel
          competitions={competitions}
          filteredCompetitions={filteredCompetitions}
          selectedCompetition={selectedCompetition}
          now={now}
          isMutationPending={isMutationPending}
          searchValue={searchValue}
          categoryFilterValue={categoryFilterValue}
          statusFilterValue={statusFilterValue}
          availableCategoryFilters={availableCategoryFilters}
          priorityOrderByCompetitionId={priorityOrderByCompetitionId}
          syncedListMaxHeight={syncedListMaxHeight}
          onSearchChange={onSearchChange}
          onCategoryFilterChange={onCategoryFilterChange}
          onStatusFilterChange={onStatusFilterChange}
          onAddCompetition={onAddCompetition}
          onSelectCompetition={onSelectCompetition}
        />

        <AdminCompetitionEditorPanel
          selectedCompetition={selectedCompetition}
          selectedValidationErrors={selectedValidationErrors}
          selectedPriorityOrder={selectedPriorityOrder}
          isSingleEventDate={isSingleEventDate}
          isMutationPending={isMutationPending}
          priorityCompetitionsCount={priorityCompetitionsCount}
          hasUnsavedChanges={hasUnsavedChanges}
          saveMessage={saveMessage}
          now={now}
          editorPanelRef={editorPanelRef}
          regStartInputRef={regStartInputRef}
          regEndInputRef={regEndInputRef}
          eventStartInputRef={eventStartInputRef}
          eventEndInputRef={eventEndInputRef}
          onFieldChange={onFieldChange}
          onLinkChange={onLinkChange}
          onSave={onSave}
          onAddCompetition={onAddCompetition}
          onDuplicateCompetition={onDuplicateCompetition}
          onResetDraft={onResetDraft}
          onDeleteCompetition={onDeleteCompetition}
          onTogglePriority={onTogglePriority}
          onEventDateModeChange={onEventDateModeChange}
          openDatePicker={openDatePicker}
        />
      </section>
    </>
  );
}
