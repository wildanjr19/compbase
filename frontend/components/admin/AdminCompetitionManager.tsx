"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  approveSubmissionAction,
  createCompetitionAction,
  deleteSubmissionAction,
  deleteCompetitionAction,
  logoutAdminAction,
  rejectSubmissionAction,
  updateCompetitionAction,
} from "@/app/admin/actions";
import { competitionSchema } from "@/lib/schemas";
import {
  COMPETITION_CATEGORIES,
  type Competition,
  type CompetitionCategory,
  type CompetitionSubmission,
  type CompetitionStatus,
  type SubmissionStatus,
} from "@/lib/types";
import {
  formatDate,
  formatDateRange,
  getDaysUntilDeadline,
  getCompetitionStatus,
} from "@/lib/utils/competitions";

interface AdminCompetitionManagerProps {
  initialCompetitions: Competition[];
  dataStatusMessage?: string | null;
  initialSubmissions?: CompetitionSubmission[];
  submissionStatusMessage?: string | null;
}

type AdminPanelTab = "competitions" | "submissions";
type AdminCompetitionStatusFilter = "all" | CompetitionStatus;

type EditableCompetitionField =
  | "name"
  | "organizer"
  | "category"
  | "regStart"
  | "regEnd"
  | "eventStart"
  | "eventEnd";

type EditableCompetitionLink =
  | "registration"
  | "guidebook"
  | "instagram"
  | "linktree"
  | "website";
type EventDateMode = "single" | "range";

const CATEGORY_OPTIONS: CompetitionCategory[] = [...COMPETITION_CATEGORIES];
const MAX_PRIORITY_COMPETITIONS = 3;

function getStatusLabel(status: CompetitionStatus): string {
  if (status === "coming-soon") {
    return "Coming Soon";
  }

  if (status === "open") {
    return "Masih buka";
  }

  return "Sudah tutup";
}

function getStatusClassName(status: CompetitionStatus): string {
  if (status === "coming-soon") {
    return "border-sky-300/24 bg-sky-300/10 text-sky-100";
  }

  if (status === "open") {
    return "border-emerald-300/24 bg-emerald-300/10 text-emerald-100";
  }

  return "border-rose-300/28 bg-rose-300/12 text-rose-100";
}

function toAdminCompetitionStatusFilter(
  value: string,
): AdminCompetitionStatusFilter {
  if (value === "open" || value === "coming-soon" || value === "closed") {
    return value;
  }

  return "all";
}

function getSubmissionStatusLabel(status: SubmissionStatus): string {
  if (status === "approved") {
    return "Disetujui";
  }

  if (status === "rejected") {
    return "Ditolak";
  }

  return "Menunggu review";
}

function getSubmissionStatusClassName(status: SubmissionStatus): string {
  if (status === "approved") {
    return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  }

  if (status === "rejected") {
    return "border-rose-300/20 bg-rose-300/10 text-rose-100";
  }

  return "border-amber-300/20 bg-amber-300/10 text-amber-100";
}

function getStatusOrder(status: CompetitionStatus): number {
  if (status === "open") {
    return 0;
  }

  if (status === "coming-soon") {
    return 1;
  }

  return 2;
}

function comparePriorityCompetition(
  left: Competition,
  right: Competition,
  now: Date,
): number {
  const leftStatus = getCompetitionStatus(left, now);
  const rightStatus = getCompetitionStatus(right, now);

  if (leftStatus !== rightStatus) {
    return getStatusOrder(leftStatus) - getStatusOrder(rightStatus);
  }

  const leftDays = getDaysUntilDeadline(left.regEnd, now);
  const rightDays = getDaysUntilDeadline(right.regEnd, now);

  if (leftDays === null && rightDays === null) {
    return left.name.localeCompare(right.name, "id-ID");
  }

  if (leftDays === null) {
    return 1;
  }

  if (rightDays === null) {
    return -1;
  }

  return leftDays - rightDays;
}

function formatDateTime(dateValue: string): string {
  if (!dateValue.trim()) {
    return "-";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function createSlug(name: string, id: string): string {
  const normalizedName = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return normalizedName ? normalizedName : `kompetisi-${id}`;
}

function getNextCompetitionIndex(competitions: Competition[]): number {
  const highestIndex = competitions.reduce<number>(
    (currentHighest, competition) => {
      const numericPart = Number.parseInt(
        competition.id.replace("cmp-", ""),
        10,
      );

      if (Number.isNaN(numericPart)) {
        return currentHighest;
      }

      return Math.max(currentHighest, numericPart);
    },
    0,
  );

  return highestIndex + 1;
}

function createEmptyCompetition(nextIndex: number): Competition {
  const id = `cmp-${String(nextIndex).padStart(3, "0")}`;

  return {
    id,
    name: "Kompetisi Baru",
    slug: `kompetisi-baru-${nextIndex}`,
    organizer: "Penyelenggara baru",
    category: "Data Science",
    regStart: "",
    regEnd: "",
    eventStart: "",
    eventEnd: "",
    isPriority: false,
    hasGuidebook: false,

    links: {
      registration: "",
      guidebook: "",
      instagram: "",
      linktree: "",
      website: "",
    },
  };
}

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function countActiveLinks(competition: Competition): number {
  return Object.values(competition.links).filter((value) =>
    Boolean(value?.trim()),
  ).length;
}

function isCompetitionCategory(value: string): value is CompetitionCategory {
  return CATEGORY_OPTIONS.some((category) => category === value);
}

function inferEventDateMode(competition: Competition): EventDateMode {
  if (
    competition.eventStart.trim() &&
    competition.eventEnd.trim() &&
    competition.eventStart !== competition.eventEnd
  ) {
    return "range";
  }

  return "single";
}

function validateCompetition(competition: Competition): string[] {
  const parsedResult = competitionSchema.safeParse(competition);

  if (parsedResult.success) {
    return [];
  }

  const uniqueMessages = new Set(
    parsedResult.error.issues.map((issue) => issue.message),
  );

  return Array.from(uniqueMessages);
}

function serializeCompetitions(competitions: Competition[]): string {
  return JSON.stringify(competitions);
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

    if (
      statusFilterValue !== "all" &&
      competitionStatus !== statusFilterValue
    ) {
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
    competitions.find(
      (competition) => competition.id === selectedCompetitionId,
    ) ??
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
    serializeCompetitions(competitions) !==
    serializeCompetitions(savedCompetitions);
  const priorityCompetitionsCount = competitions.filter(
    (competition) => competition.isPriority,
  ).length;
  const priorityCompetitionIds = competitions
    .filter((competition) => competition.isPriority)
    .sort((left, right) => comparePriorityCompetition(left, right, now))
    .map((competition) => competition.id);
  const priorityOrderByCompetitionId = new Map<string, number>(
    priorityCompetitionIds.map((competitionId, index) => [
      competitionId,
      index + 1,
    ]),
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

  const handleLinkChange = (
    field: EditableCompetitionLink,
    value: string,
  ): void => {
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
    setSaveMessage(
      `Salinan baru dari "${selectedCompetition.name}" sudah dibuat.`,
    );
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

      const deletedId = mutationResult.deletedId;

      setCompetitions((currentCompetitions) => {
        const remainingCompetitions = currentCompetitions.filter(
          (competition) => competition.id !== deletedId,
        );

        setSelectedCompetitionId((currentSelectedCompetitionId) =>
          currentSelectedCompetitionId === deletedId
            ? (remainingCompetitions[0]?.id ?? "")
            : currentSelectedCompetitionId,
        );

        return remainingCompetitions;
      });

      setSavedCompetitions((currentCompetitions) =>
        currentCompetitions.filter(
          (competition) => competition.id !== deletedId,
        ),
      );

      setSaveMessage(
        `"${selectedCompetitionName}" berhasil dihapus dari backend.`,
      );
    });
  };

  const handleApproveSubmission = (submissionId: string): void => {
    startMutationTransition(async () => {
      const mutationResult = await approveSubmissionAction(submissionId);

      if (!mutationResult.ok || !mutationResult.competition) {
        setSubmissionMessage(
          mutationResult.errorMessage ??
            "Pengajuan belum berhasil disetujui.",
        );
        return;
      }

      const persistedCompetition = mutationResult.competition;
      const nowIso = new Date().toISOString();

      setSubmissions((currentSubmissions) =>
        currentSubmissions.map((submission) =>
          submission.id === submissionId
            ? {
                ...submission,
                status: "approved",
                reviewedAt: nowIso,
                updatedAt: nowIso,
              }
            : submission,
        ),
      );

      setCompetitions((currentCompetitions) => {
        const hasCompetition = currentCompetitions.some(
          (competition) => competition.id === persistedCompetition.id,
        );

        if (hasCompetition) {
          return currentCompetitions.map((competition) =>
            competition.id === persistedCompetition.id
              ? persistedCompetition
              : competition,
          );
        }

        return [persistedCompetition, ...currentCompetitions];
      });

      setSavedCompetitions((currentCompetitions) => {
        const hasCompetition = currentCompetitions.some(
          (competition) => competition.id === persistedCompetition.id,
        );

        if (hasCompetition) {
          return currentCompetitions.map((competition) =>
            competition.id === persistedCompetition.id
              ? persistedCompetition
              : competition,
          );
        }

        return [persistedCompetition, ...currentCompetitions];
      });

      setSubmissionMessage("Pengajuan berhasil disetujui dan masuk ke daftar kompetisi.");
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

      const nowIso = new Date().toISOString();

      setSubmissions((currentSubmissions) =>
        currentSubmissions.map((submission) =>
          submission.id === mutationResult.submissionId
            ? {
                ...submission,
                status: "rejected",
                reviewedAt: nowIso,
                updatedAt: nowIso,
              }
            : submission,
        ),
      );

      setSubmissionMessage("Pengajuan berhasil ditolak.");
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
                  untuk mengelola detail lomba, jadwal, deskripsi, prioritas,
                  dan tautan penting dengan lebih aman.
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
          <aside
            style={
              syncedListMaxHeight
                ? { maxHeight: `${syncedListMaxHeight}px` }
                : undefined
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
                    onClick={handleAddCompetition}
                    className="inline-flex h-9 items-center justify-center rounded-full bg-amber-200 px-4 text-xs font-semibold uppercase tracking-wide text-zinc-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Tambah kompetisi
                  </button>
                  <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
                    {filteredCompetitions.length} dari {competitions.length}{" "}
                    data
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-zinc-200">
                    Cari kompetisi
                  </span>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Cari nama, penyelenggara, atau kategori"
                    className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 placeholder:text-zinc-500 focus:ring"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-zinc-200">
                      Filter kategori
                    </span>
                    <select
                      value={categoryFilterValue}
                      onChange={(event) =>
                        setCategoryFilterValue(event.target.value)
                      }
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
                    <span className="font-medium text-zinc-200">
                      Filter status
                    </span>
                    <select
                      value={statusFilterValue}
                      onChange={(event) =>
                        setStatusFilterValue(
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
                      onClick={() => setSelectedCompetitionId(competition.id)}
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
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${getStatusClassName(status)}`}
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
                        onClick={handleAddCompetition}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-amber-200 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Tambah kompetisi
                      </button>
                      <button
                        type="button"
                        disabled={isMutationPending}
                        onClick={handleDuplicateCompetition}
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
                      onClick={handleSave}
                      className="inline-flex h-11 items-center justify-center rounded-full bg-amber-200 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isMutationPending ? "Menyimpan..." : "Simpan perubahan"}
                    </button>
                    <button
                      type="button"
                      disabled={isMutationPending}
                      onClick={handleResetSelectedCompetition}
                      className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 px-5 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Reset draft
                    </button>
                    <button
                      type="button"
                      disabled={isMutationPending}
                      onClick={handleDeleteCompetition}
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
                      onClick={handleTogglePriority}
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
                      <span className="font-medium text-zinc-200">
                        Nama kompetisi
                      </span>
                      <input
                        type="text"
                        value={selectedCompetition.name}
                        onChange={(event) =>
                          handleFieldChange("name", event.target.value)
                        }
                        className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                      />
                    </label>

                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-zinc-200">
                        Penyelenggara
                      </span>
                      <input
                        type="text"
                        value={selectedCompetition.organizer}
                        onChange={(event) =>
                          handleFieldChange("organizer", event.target.value)
                        }
                        className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                      />
                    </label>

                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-zinc-200">
                        Kategori
                      </span>
                      <div className="relative">
                        <select
                          value={selectedCompetition.category}
                          onChange={(event) =>
                            handleFieldChange("category", event.target.value)
                          }
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
                          handleEventDateModeChange(
                            isSingleEventDate ? "range" : "single",
                          )
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
                      <span className="font-medium text-zinc-200">
                        Buka registrasi
                      </span>
                      <div className="relative">
                        <input
                          ref={regStartInputRef}
                          type="date"
                          value={selectedCompetition.regStart}
                          onChange={(event) =>
                            handleFieldChange("regStart", event.target.value)
                          }
                          className="h-11 w-full appearance-none rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 pr-11 text-zinc-100 outline-none ring-amber-200/30 focus:ring [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            openDatePicker(regStartInputRef.current)
                          }
                          aria-label="Buka kalender tanggal buka registrasi"
                          className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-zinc-300 transition hover:text-zinc-100"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M4 1.75V3.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <path
                              d="M12 1.75V3.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <rect
                              x="2.5"
                              y="2.75"
                              width="11"
                              height="10.75"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M2.5 5.75H13.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                          </svg>
                        </button>
                      </div>
                    </label>

                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-zinc-200">
                        Tutup registrasi
                      </span>
                      <div className="relative">
                        <input
                          ref={regEndInputRef}
                          type="date"
                          value={selectedCompetition.regEnd}
                          onChange={(event) =>
                            handleFieldChange("regEnd", event.target.value)
                          }
                          className="h-11 w-full appearance-none rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 pr-11 text-zinc-100 outline-none ring-amber-200/30 focus:ring [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                        />
                        <button
                          type="button"
                          onClick={() => openDatePicker(regEndInputRef.current)}
                          aria-label="Buka kalender tanggal tutup registrasi"
                          className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-zinc-300 transition hover:text-zinc-100"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M4 1.75V3.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <path
                              d="M12 1.75V3.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <rect
                              x="2.5"
                              y="2.75"
                              width="11"
                              height="10.75"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M2.5 5.75H13.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                          </svg>
                        </button>
                      </div>
                    </label>

                    <label className={`grid gap-2 text-sm ${isSingleEventDate ? "sm:col-span-2" : ""}`}>
                      <span className="font-medium text-zinc-200">
                        {isSingleEventDate
                          ? "Tanggal penyisihan"
                          : "Mulai penyisihan"}
                      </span>
                      <div className="relative">
                        <input
                          ref={eventStartInputRef}
                          type="date"
                          value={selectedCompetition.eventStart}
                          onChange={(event) =>
                            handleFieldChange("eventStart", event.target.value)
                          }
                          className="h-11 w-full appearance-none rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 pr-11 text-zinc-100 outline-none ring-amber-200/30 focus:ring [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            openDatePicker(eventStartInputRef.current)
                          }
                          aria-label="Buka kalender tanggal mulai penyisihan"
                          className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-zinc-300 transition hover:text-zinc-100"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M4 1.75V3.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <path
                              d="M12 1.75V3.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <rect
                              x="2.5"
                              y="2.75"
                              width="11"
                              height="10.75"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M2.5 5.75H13.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                          </svg>
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
                              handleFieldChange("eventEnd", event.target.value)
                            }
                            className="h-11 w-full appearance-none rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 pr-11 text-zinc-100 outline-none ring-amber-200/30 focus:ring [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              openDatePicker(eventEndInputRef.current)
                            }
                            aria-label="Buka kalender tanggal selesai penyisihan"
                            className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-zinc-300 transition hover:text-zinc-100"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M4 1.75V3.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M12 1.75V3.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                              <rect
                                x="2.5"
                                y="2.75"
                                width="11"
                                height="10.75"
                                rx="2"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                              <path
                                d="M2.5 5.75H13.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                            </svg>
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
                        <span className="font-medium text-zinc-200">
                          Link registrasi
                        </span>
                        <input
                          type="url"
                          value={selectedCompetition.links.registration ?? ""}
                          onChange={(event) =>
                            handleLinkChange("registration", event.target.value)
                          }
                          className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                        />
                      </label>

                      <label className="grid gap-2 text-sm">
                        <span className="font-medium text-zinc-200">
                          Link guidebook
                        </span>
                        <input
                          type="url"
                          value={selectedCompetition.links.guidebook ?? ""}
                          onChange={(event) =>
                            handleLinkChange("guidebook", event.target.value)
                          }
                          className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                        />
                      </label>

                      <label className="grid gap-2 text-sm">
                        <span className="font-medium text-zinc-200">
                          Instagram
                        </span>
                        <input
                          type="url"
                          value={selectedCompetition.links.instagram ?? ""}
                          onChange={(event) =>
                            handleLinkChange("instagram", event.target.value)
                          }
                          className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                        />
                      </label>

                      <label className="grid gap-2 text-sm">
                        <span className="font-medium text-zinc-200">
                          Linktree
                        </span>
                        <input
                          type="url"
                          value={selectedCompetition.links.linktree ?? ""}
                          onChange={(event) =>
                            handleLinkChange("linktree", event.target.value)
                          }
                          className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                        />
                      </label>

                      <label className="grid gap-2 text-sm lg:col-span-2">
                        <span className="font-medium text-zinc-200">
                          Website resmi
                        </span>
                        <input
                          type="url"
                          value={selectedCompetition.links.website ?? ""}
                          onChange={(event) =>
                            handleLinkChange("website", event.target.value)
                          }
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
                        {getStatusLabel(
                          getCompetitionStatus(selectedCompetition, now),
                        )}
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
        </section>
          </>
        ) : (
          <section className="grid gap-4">
            {submissionStatusMessage ? (
              <section className="rounded-[1.25rem] border border-amber-200/14 bg-amber-200/8 px-4 py-3 text-sm text-amber-50 backdrop-blur-md sm:px-5">
                <p>{submissionStatusMessage}</p>
              </section>
            ) : null}

            <section className="rounded-[1.55rem] border border-white/10 bg-[oklch(0.16_0.02_250_/_0.88)] p-5 backdrop-blur-2xl sm:p-6">
              <div className="flex flex-col gap-3 border-b border-white/8 pb-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Pengajuan masuk
                </p>
                <h2 className="font-brand text-[1.75rem] leading-tight text-zinc-50 sm:text-[2rem]">
                  Review pengajuan dari publik
                </h2>
                <p className="text-sm text-zinc-400">{submissionMessage}</p>
              </div>

              <div className="mt-5 grid gap-4">
                {submissions.length === 0 ? (
                  <div className="rounded-[1.2rem] border border-dashed border-white/10 px-4 py-10 text-center text-sm text-zinc-400">
                    Belum ada pengajuan yang masuk.
                  </div>
                ) : (
                  submissions.map((submission) => (
                    <article
                      key={submission.id}
                      className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <h3 className="text-base font-semibold text-zinc-100">
                            {submission.name}
                          </h3>
                          <p className="text-sm text-zinc-400">
                            {submission.organizer} • {submission.category}
                          </p>
                          <p className="text-xs text-zinc-500">
                            Pengaju: {submission.submitterName} ({submission.submitterEmail})
                          </p>
                          <p className="text-xs text-zinc-500">
                            Dikirim: {formatDateTime(submission.createdAt)}
                          </p>
                        </div>

                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${getSubmissionStatusClassName(
                            submission.status,
                          )}`}
                        >
                          {getSubmissionStatusLabel(submission.status)}
                        </span>
                      </div>

                      {submission.notes ? (
                        <p className="mt-3 rounded-[0.9rem] border border-white/8 bg-black/10 px-3 py-2 text-sm text-zinc-300">
                          {submission.notes}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
                        <span>Deadline: {formatDate(submission.regEnd)}</span>
                        <span>
                          Review: {submission.reviewedAt ? formatDateTime(submission.reviewedAt) : "Belum direview"}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {submission.status === "pending" ? (
                          <>
                          <button
                            type="button"
                            disabled={isMutationPending}
                            onClick={() => handleApproveSubmission(submission.id)}
                            className="inline-flex h-10 items-center justify-center rounded-full border border-emerald-300/22 bg-emerald-300/12 px-4 text-sm font-medium text-emerald-100 transition hover:border-emerald-300/32 hover:bg-emerald-300/18 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            Terima
                          </button>
                          <button
                            type="button"
                            disabled={isMutationPending}
                            onClick={() => handleRejectSubmission(submission.id)}
                            className="inline-flex h-10 items-center justify-center rounded-full border border-rose-300/22 bg-rose-300/12 px-4 text-sm font-medium text-rose-100 transition hover:border-rose-300/32 hover:bg-rose-300/18 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            Tolak
                          </button>
                          </>
                        ) : null}
                        <button
                          type="button"
                          disabled={isMutationPending}
                          onClick={() => handleDeleteSubmission(submission.id)}
                          className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300/22 bg-zinc-300/12 px-4 text-sm font-medium text-zinc-100 transition hover:border-zinc-300/34 hover:bg-zinc-300/20 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Hapus
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </section>
        )}
      </div>
    </main>
  );
}
