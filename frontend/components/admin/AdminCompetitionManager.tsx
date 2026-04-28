"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
import {
  approveSubmissionAction,
  createCompetitionAction,
  deleteCompetitionAction,
  deleteSubmissionAction,
  logoutAdminAction,
  rejectSubmissionAction,
  updateCompetitionAction,
} from "@/app/admin/actions";
import { AdminCompetitionWorkspace } from "@/components/admin/AdminCompetitionWorkspace";
import { AdminSubmissionReviewPanel } from "@/components/admin/AdminSubmissionReviewPanel";
import type { Competition, CompetitionSubmission } from "@/lib/types";
import { getCompetitionStatus } from "@/lib/utils/competitions";
import {
  comparePriorityCompetition,
  createEmptyCompetition,
  createSlug,
  getNextCompetitionIndex,
  inferEventDateMode,
  isCompetitionCategory,
  normalizeSearchValue,
  serializeCompetitions,
  validateCompetition,
  type AdminCompetitionStatusFilter,
  type AdminPanelTab,
  type EditableCompetitionField,
  type EditableCompetitionLink,
  type EventDateMode,
  MAX_PRIORITY_COMPETITIONS,
} from "@/components/admin/AdminCompetitionManager.utils";

interface AdminCompetitionManagerProps {
  initialCompetitions: Competition[];
  dataStatusMessage?: string | null;
  initialSubmissions?: CompetitionSubmission[];
  submissionStatusMessage?: string | null;
}

export function AdminCompetitionManager({
  initialCompetitions,
  dataStatusMessage = null,
  initialSubmissions = [],
  submissionStatusMessage = null,
}: AdminCompetitionManagerProps) {
  const [isMutationPending, startMutationTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<AdminPanelTab>("competitions");
  const [competitions, setCompetitions] =
    useState<Competition[]>(initialCompetitions);
  const [savedCompetitions, setSavedCompetitions] =
    useState<Competition[]>(initialCompetitions);
  const [submissions, setSubmissions] =
    useState<CompetitionSubmission[]>(initialSubmissions);
  const [submissionMessage, setSubmissionMessage] = useState<string>(
    "Pengajuan baru akan muncul di tab ini untuk direview.",
  );
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>(
    initialCompetitions[0]?.id ?? "",
  );
  const [searchValue, setSearchValue] = useState<string>("");
  const [categoryFilterValue, setCategoryFilterValue] = useState<string>("all");
  const [statusFilterValue, setStatusFilterValue] =
    useState<AdminCompetitionStatusFilter>("all");
  const [saveMessage, setSaveMessage] = useState<string>(
    "Belum ada perubahan baru yang disimpan di sesi browser ini.",
  );
  const [eventDateModeByCompetitionId, setEventDateModeByCompetitionId] =
    useState<Record<string, EventDateMode>>({});
  const deferredSearchValue = useDeferredValue(searchValue);
  const regStartInputRef = useRef<HTMLInputElement>(null);
  const regEndInputRef = useRef<HTMLInputElement>(null);
  const eventStartInputRef = useRef<HTMLInputElement>(null);
  const eventEndInputRef = useRef<HTMLInputElement>(null);
  const editorPanelRef = useRef<HTMLElement>(null);
  const [syncedListMaxHeight, setSyncedListMaxHeight] = useState<number | null>(
    null,
  );
  const now = new Date();

  useEffect(() => {
    const editorPanelElement = editorPanelRef.current;

    if (!editorPanelElement || typeof window === "undefined") {
      return;
    }

    const desktopMediaQuery = window.matchMedia("(min-width: 1280px)");

    // Sinkronkan tinggi daftar dengan panel editor agar daftar tetap scrollable.
    const syncListHeight = (): void => {
      if (!desktopMediaQuery.matches) {
        setSyncedListMaxHeight(null);
        return;
      }

      setSyncedListMaxHeight(
        Math.ceil(editorPanelElement.getBoundingClientRect().height),
      );
    };

    syncListHeight();

    const resizeObserver = new ResizeObserver(() => {
      syncListHeight();
    });

    resizeObserver.observe(editorPanelElement);
    window.addEventListener("resize", syncListHeight);
    desktopMediaQuery.addEventListener("change", syncListHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncListHeight);
      desktopMediaQuery.removeEventListener("change", syncListHeight);
    };
  }, []);

  const openDatePicker = (inputElement: HTMLInputElement | null): void => {
    if (!inputElement) {
      return;
    }

    const inputWithPicker = inputElement as HTMLInputElement & {
      showPicker?: () => void;
    };

    if (typeof inputWithPicker.showPicker === "function") {
      inputWithPicker.showPicker();
      return;
    }

    inputElement.focus();
  };

  const availableCategoryFilters = Array.from(
    new Set(competitions.map((competition) => competition.category)),
  ).sort((left, right) => left.localeCompare(right, "id-ID"));

  const normalizedQuery = normalizeSearchValue(deferredSearchValue);
  const filteredCompetitions = competitions.filter((competition) => {
    if (
      categoryFilterValue !== "all" &&
      competition.category !== categoryFilterValue
    ) {
      return false;
    }

    const competitionStatus = getCompetitionStatus(competition, now);

    if (statusFilterValue !== "all" && competitionStatus !== statusFilterValue) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [competition.name, competition.organizer, competition.category]
      .map((value) => normalizeSearchValue(value))
      .some((value) => value.includes(normalizedQuery));
  });

  const selectedCompetition =
    competitions.find((competition) => competition.id === selectedCompetitionId) ??
    competitions[0] ??
    null;

  const selectedSavedCompetition =
    savedCompetitions.find(
      (competition) => competition.id === selectedCompetitionId,
    ) ?? null;

  const selectedValidationErrors = selectedCompetition
    ? validateCompetition(selectedCompetition)
    : [];
  const hasUnsavedChanges =
    serializeCompetitions(competitions) !== serializeCompetitions(savedCompetitions);

  const priorityCompetitionsCount = competitions.filter(
    (competition) => competition.isPriority,
  ).length;

  const priorityCompetitionIds = competitions
    .filter((competition) => competition.isPriority)
    .sort((left, right) => comparePriorityCompetition(left, right, now))
    .map((competition) => competition.id);

  const priorityOrderByCompetitionId = new Map<string, number>(
    priorityCompetitionIds.map((competitionId, index) => [competitionId, index + 1]),
  );

  const selectedPriorityOrder = selectedCompetition
    ? priorityOrderByCompetitionId.get(selectedCompetition.id) ?? null
    : null;

  const selectedEventDateMode = selectedCompetition
    ? (eventDateModeByCompetitionId[selectedCompetition.id] ??
      inferEventDateMode(selectedCompetition))
    : "single";

  const isSingleEventDate = selectedEventDateMode === "single";

  const openCompetitions = competitions.filter(
    (competition) => getCompetitionStatus(competition, now) === "open",
  ).length;
  const comingSoonCompetitions = competitions.filter(
    (competition) => getCompetitionStatus(competition, now) === "coming-soon",
  ).length;
  const closedCompetitions = competitions.filter(
    (competition) => getCompetitionStatus(competition, now) === "closed",
  ).length;

  const updateCompetition = (
    competitionId: string,
    updater: (competition: Competition) => Competition,
  ): void => {
    setCompetitions((currentCompetitions) =>
      currentCompetitions.map((competition) =>
        competition.id === competitionId ? updater(competition) : competition,
      ),
    );
  };

  const handleFieldChange = (
    field: EditableCompetitionField,
    value: string,
  ): void => {
    if (!selectedCompetition) {
      return;
    }

    if (field === "category" && value === "Olympiad") {
      setEventDateModeByCompetitionId((currentModes) => ({
        ...currentModes,
        [selectedCompetition.id]: "single",
      }));
    }

    updateCompetition(selectedCompetition.id, (competition) => {
      if (field === "category") {
        if (!isCompetitionCategory(value)) {
          return competition;
        }

        return {
          ...competition,
          category: value,
        };
      }

      const updatedCompetition: Competition = {
        ...competition,
        [field]: value,
      };

      if (field === "eventStart" && isSingleEventDate) {
        updatedCompetition.eventEnd = value;
      }

      if (field === "name") {
        updatedCompetition.slug = createSlug(value, competition.id);
      }

      return updatedCompetition;
    });
  };

  const handleLinkChange = (field: EditableCompetitionLink, value: string): void => {
    if (!selectedCompetition) {
      return;
    }

    updateCompetition(selectedCompetition.id, (competition) => {
      const nextLinks = {
        ...competition.links,
        [field]: value,
      };

      return {
        ...competition,
        hasGuidebook: Boolean(nextLinks.guidebook?.trim()),
        links: nextLinks,
      };
    });
  };

  const handleSave = (): void => {
    if (!selectedCompetition) {
      return;
    }

    if (priorityCompetitionsCount > MAX_PRIORITY_COMPETITIONS) {
      setSaveMessage(
        `Maksimal ${MAX_PRIORITY_COMPETITIONS} kompetisi prioritas. Kurangi tanda prioritas terlebih dahulu sebelum menyimpan.`,
      );
      return;
    }

    const selectedCompetitionIdValue = selectedCompetition.id;
    if (selectedValidationErrors.length > 0) {
      setSaveMessage(
        `Perubahan belum bisa disimpan karena "${selectedCompetition.name}" masih memiliki ${selectedValidationErrors.length} masalah data.`,
      );
      return;
    }

    const hasSavedVersion = savedCompetitions.some(
      (competition) => competition.id === selectedCompetitionIdValue,
    );

    startMutationTransition(async () => {
      const mutationResult = hasSavedVersion
        ? await updateCompetitionAction(
            selectedCompetitionIdValue,
            selectedCompetition,
          )
        : await createCompetitionAction(selectedCompetition);

      if (!mutationResult.ok || !mutationResult.competition) {
        setSaveMessage(
          mutationResult.errorMessage ??
            `Perubahan untuk "${selectedCompetition.name}" belum berhasil disimpan ke backend.`,
        );
        return;
      }

      const persistedCompetition = mutationResult.competition;

      setCompetitions((currentCompetitions) =>
        currentCompetitions.map((competition) =>
          competition.id === persistedCompetition.id
            ? persistedCompetition
            : competition,
        ),
      );

      setSavedCompetitions((currentCompetitions) => {
        const hasSavedCompetition = currentCompetitions.some(
          (competition) => competition.id === persistedCompetition.id,
        );

        if (!hasSavedCompetition) {
          return [persistedCompetition, ...currentCompetitions];
        }

        return currentCompetitions.map((competition) =>
          competition.id === persistedCompetition.id
            ? persistedCompetition
            : competition,
        );
      });

      setSaveMessage(
        hasSavedVersion
          ? `Perubahan untuk "${persistedCompetition.name}" berhasil disimpan ke backend.`
          : `Kompetisi baru "${persistedCompetition.name}" berhasil dibuat di backend.`,
      );
    });
  };

  const handleAddCompetition = (): void => {
    const nextCompetition = createEmptyCompetition(
      getNextCompetitionIndex(competitions),
    );

    setCompetitions((currentCompetitions) => [
      nextCompetition,
      ...currentCompetitions,
    ]);
    setSelectedCompetitionId(nextCompetition.id);
    setSaveMessage(
      `Draft baru "${nextCompetition.name}" sudah ditambahkan dan siap dilengkapi.`,
    );
  };

  const handleDuplicateCompetition = (): void => {
    if (!selectedCompetition) {
      return;
    }

    const nextIndex = getNextCompetitionIndex(competitions);
    const duplicatedCompetition: Competition = {
      ...selectedCompetition,
      id: `cmp-${String(nextIndex).padStart(3, "0")}`,
      name: `${selectedCompetition.name} Copy`,
      isPriority: false,
    };

    duplicatedCompetition.slug = createSlug(
      duplicatedCompetition.name,
      duplicatedCompetition.id,
    );

    setCompetitions((currentCompetitions) => [
      duplicatedCompetition,
      ...currentCompetitions,
    ]);
    setSelectedCompetitionId(duplicatedCompetition.id);
    setSaveMessage(`Salinan baru dari "${selectedCompetition.name}" sudah dibuat.`);
  };

  const handleResetSelectedCompetition = (): void => {
    if (!selectedCompetition) {
      return;
    }

    if (!selectedSavedCompetition) {
      const remainingCompetitions = competitions.filter(
        (competition) => competition.id !== selectedCompetition.id,
      );

      setCompetitions(remainingCompetitions);
      setSelectedCompetitionId(remainingCompetitions[0]?.id ?? "");
      setSaveMessage(
        `Draft "${selectedCompetition.name}" dibatalkan karena belum pernah disimpan.`,
      );
      return;
    }

    updateCompetition(selectedCompetition.id, () => selectedSavedCompetition);
    setSaveMessage(
      `Perubahan pada "${selectedCompetition.name}" sudah dikembalikan ke versi tersimpan.`,
    );
  };

  const handleDeleteCompetition = (): void => {
    if (!selectedCompetition) {
      return;
    }

    const selectedCompetitionIdValue = selectedCompetition.id;
    const selectedCompetitionName = selectedCompetition.name;
    const hasSavedVersion = savedCompetitions.some(
      (competition) => competition.id === selectedCompetitionIdValue,
    );

    if (!hasSavedVersion) {
      const remainingCompetitions = competitions.filter(
        (competition) => competition.id !== selectedCompetitionIdValue,
      );

      setCompetitions(remainingCompetitions);
      setSelectedCompetitionId(remainingCompetitions[0]?.id ?? "");
      setSaveMessage(
        `Draft "${selectedCompetitionName}" dibatalkan karena belum pernah dikirim ke backend.`,
      );
      return;
    }

    startMutationTransition(async () => {
      const mutationResult = await deleteCompetitionAction(
        selectedCompetitionIdValue,
      );

      if (!mutationResult.ok || !mutationResult.deletedId) {
        setSaveMessage(
          mutationResult.errorMessage ??
            `Kompetisi "${selectedCompetitionName}" belum berhasil dihapus dari backend.`,
        );
        return;
      }

      const remainingCompetitions = competitions.filter(
        (competition) => competition.id !== mutationResult.deletedId,
      );

      setCompetitions(remainingCompetitions);
      setSavedCompetitions((currentCompetitions) =>
        currentCompetitions.filter(
          (competition) => competition.id !== mutationResult.deletedId,
        ),
      );
      setSelectedCompetitionId(remainingCompetitions[0]?.id ?? "");
      setSaveMessage(`"${selectedCompetitionName}" berhasil dihapus dari backend.`);
    });
  };

  const handleApproveSubmission = (submissionId: string): void => {
    startMutationTransition(async () => {
      const mutationResult = await approveSubmissionAction(submissionId);

      if (!mutationResult.ok || !mutationResult.competition) {
        setSubmissionMessage(
          mutationResult.errorMessage ??
            "Pengajuan belum berhasil disetujui dan dikonversi menjadi kompetisi.",
        );
        return;
      }

      const approvedCompetition = mutationResult.competition;

      setCompetitions((currentCompetitions) => [
        approvedCompetition,
        ...currentCompetitions,
      ]);

      setSavedCompetitions((currentCompetitions) => [
        approvedCompetition,
        ...currentCompetitions,
      ]);

      setSubmissions((currentSubmissions) =>
        currentSubmissions.map((submission) =>
          submission.id === submissionId
            ? {
                ...submission,
                status: "approved",
                reviewedAt: new Date().toISOString(),
              }
            : submission,
        ),
      );

      setSubmissionMessage(
        `Pengajuan berhasil disetujui. Kompetisi "${approvedCompetition.name}" sudah masuk daftar utama.`,
      );
    });
  };

  const handleRejectSubmission = (submissionId: string): void => {
    startMutationTransition(async () => {
      const mutationResult = await rejectSubmissionAction(submissionId);

      if (!mutationResult.ok || !mutationResult.submissionId) {
        setSubmissionMessage(
          mutationResult.errorMessage ?? "Pengajuan belum berhasil ditolak.",
        );
        return;
      }

      setSubmissions((currentSubmissions) =>
        currentSubmissions.map((submission) =>
          submission.id === mutationResult.submissionId
            ? {
                ...submission,
                status: "rejected",
                reviewedAt: new Date().toISOString(),
              }
            : submission,
        ),
      );

      setSubmissionMessage("Pengajuan sudah ditandai sebagai ditolak.");
    });
  };

  const handleEventDateModeChange = (mode: EventDateMode): void => {
    if (!selectedCompetition) {
      return;
    }

    setEventDateModeByCompetitionId((currentModes) => ({
      ...currentModes,
      [selectedCompetition.id]: mode,
    }));

    if (mode === "single") {
      updateCompetition(selectedCompetition.id, (competition) => ({
        ...competition,
        eventEnd: competition.eventStart,
      }));
    }
  };

  const handleTogglePriority = (): void => {
    if (!selectedCompetition) {
      return;
    }

    const willBecomePriority = !selectedCompetition.isPriority;

    if (
      willBecomePriority &&
      priorityCompetitionsCount >= MAX_PRIORITY_COMPETITIONS
    ) {
      return;
    }

    updateCompetition(selectedCompetition.id, (competition) => ({
      ...competition,
      isPriority: !competition.isPriority,
    }));
  };

  const handleDeleteSubmission = (submissionId: string): void => {
    startMutationTransition(async () => {
      const mutationResult = await deleteSubmissionAction(submissionId);

      if (!mutationResult.ok || !mutationResult.submissionId) {
        setSubmissionMessage(
          mutationResult.errorMessage ?? "Pengajuan belum berhasil dihapus.",
        );
        return;
      }

      setSubmissions((currentSubmissions) =>
        currentSubmissions.filter(
          (submission) => submission.id !== mutationResult.submissionId,
        ),
      );

      setSubmissionMessage("Pengajuan berhasil dihapus.");
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[10%] h-[24rem] w-[24rem] rounded-full bg-amber-300/10 blur-[120px]" />
        <div className="absolute right-[-12rem] top-[-6rem] h-[28rem] w-[28rem] rounded-full bg-emerald-300/10 blur-[140px]" />
        <div className="absolute bottom-[-10rem] left-1/2 h-[24rem] w-[40rem] -translate-x-1/2 rounded-full bg-sky-300/10 blur-[150px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-[1.7rem] border border-white/10 bg-[oklch(0.16_0.02_250_/_0.9)] p-5 shadow-[0_30px_90px_-55px_oklch(0.05_0.03_250)] backdrop-blur-2xl sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl space-y-3">
              <span className="inline-flex rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-zinc-200">
                Panel admin
              </span>
              <div>
                <h1 className="font-brand text-[clamp(1.9rem,4.2vw,3.3rem)] leading-[1] text-zinc-50">
                  Kelola kompetisi dengan meja kerja yang lebih rapi.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                  Panel ini sekarang sudah diproteksi login admin dan dirapikan
                  untuk mengelola detail lomba, jadwal, deskripsi, prioritas, dan
                  tautan penting dengan lebih aman.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 sm:pt-1">
              <Link
                href="/"
                aria-label="Kembali ke beranda"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
              >
                Kembali ke beranda
              </Link>

              <form action={logoutAdminAction}>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-rose-300/18 bg-rose-300/10 px-4 text-sm font-medium text-rose-100 transition hover:border-rose-300/32 hover:bg-rose-300/14"
                >
                  Keluar
                </button>
              </form>
            </div>
          </div>
        </header>

        <section className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("competitions")}
            className={`inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-medium transition ${
              activeTab === "competitions"
                ? "border-amber-200/28 bg-amber-200/14 text-amber-100"
                : "border-white/10 bg-white/[0.03] text-zinc-200 hover:border-white/20 hover:bg-white/[0.05]"
            }`}
          >
            Kelola Kompetisi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("submissions")}
            className={`inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-medium transition ${
              activeTab === "submissions"
                ? "border-amber-200/28 bg-amber-200/14 text-amber-100"
                : "border-white/10 bg-white/[0.03] text-zinc-200 hover:border-white/20 hover:bg-white/[0.05]"
            }`}
          >
            Pengajuan Masuk
          </button>
        </section>

        {activeTab === "competitions" ? (
          <AdminCompetitionWorkspace
            competitions={competitions}
            filteredCompetitions={filteredCompetitions}
            selectedCompetition={selectedCompetition}
            selectedValidationErrors={selectedValidationErrors}
            selectedPriorityOrder={selectedPriorityOrder}
            isSingleEventDate={isSingleEventDate}
            now={now}
            isMutationPending={isMutationPending}
            dataStatusMessage={dataStatusMessage}
            openCompetitions={openCompetitions}
            comingSoonCompetitions={comingSoonCompetitions}
            closedCompetitions={closedCompetitions}
            searchValue={searchValue}
            categoryFilterValue={categoryFilterValue}
            statusFilterValue={statusFilterValue}
            availableCategoryFilters={availableCategoryFilters}
            priorityOrderByCompetitionId={priorityOrderByCompetitionId}
            syncedListMaxHeight={syncedListMaxHeight}
            priorityCompetitionsCount={priorityCompetitionsCount}
            hasUnsavedChanges={hasUnsavedChanges}
            saveMessage={saveMessage}
            regStartInputRef={regStartInputRef}
            regEndInputRef={regEndInputRef}
            eventStartInputRef={eventStartInputRef}
            eventEndInputRef={eventEndInputRef}
            editorPanelRef={editorPanelRef}
            onSearchChange={setSearchValue}
            onCategoryFilterChange={setCategoryFilterValue}
            onStatusFilterChange={setStatusFilterValue}
            onAddCompetition={handleAddCompetition}
            onSelectCompetition={setSelectedCompetitionId}
            onFieldChange={handleFieldChange}
            onLinkChange={handleLinkChange}
            onSave={handleSave}
            onDuplicateCompetition={handleDuplicateCompetition}
            onResetDraft={handleResetSelectedCompetition}
            onDeleteCompetition={handleDeleteCompetition}
            onTogglePriority={handleTogglePriority}
            onEventDateModeChange={handleEventDateModeChange}
            openDatePicker={openDatePicker}
          />
        ) : (
          <AdminSubmissionReviewPanel
            submissions={submissions}
            submissionMessage={submissionMessage}
            submissionStatusMessage={submissionStatusMessage}
            isMutationPending={isMutationPending}
            onApproveSubmission={handleApproveSubmission}
            onRejectSubmission={handleRejectSubmission}
            onDeleteSubmission={handleDeleteSubmission}
          />
        )}
      </div>
    </main>
  );
}
