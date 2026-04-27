"use client";

import Link from "next/link";
import { useDeferredValue, useState, useTransition } from "react";
import {
  createCompetitionAction,
  deleteCompetitionAction,
  logoutAdminAction,
  updateCompetitionAction,
} from "@/app/admin/actions";
import { competitionSchema } from "@/lib/schemas";
import type { Competition, CompetitionCategory, CompetitionStatus } from "@/lib/types";
import { formatDate, formatDateRange, getCompetitionStatus } from "@/lib/utils/competitions";

interface AdminCompetitionManagerProps {
  initialCompetitions: Competition[];
  dataStatusMessage?: string | null;
}

type EditableCompetitionField =
  | "name"
  | "organizer"
  | "category"
  | "regStart"
  | "regEnd"
  | "eventStart"
  | "eventEnd"
  | "description";

type EditableCompetitionLink = "registration" | "guidebook" | "instagram" | "linktree" | "website";

const CATEGORY_OPTIONS: CompetitionCategory[] = [
  "Dashboard",
  "Data Mining",
  "Data Science",
  "Datathon",
  "Essay",
  "Hackathon",
  "Infografis",
  "LKTI",
];

function getStatusLabel(status: CompetitionStatus): string {
  if (status === "open") {
    return "Masih buka";
  }

  if (status === "closing-soon") {
    return "Deadline dekat";
  }

  return "Sudah tutup";
}

function getStatusClassName(status: CompetitionStatus): string {
  if (status === "open") {
    return "border-emerald-300/24 bg-emerald-300/10 text-emerald-100";
  }

  if (status === "closing-soon") {
    return "border-amber-300/28 bg-amber-300/12 text-amber-100";
  }

  return "border-rose-300/28 bg-rose-300/12 text-rose-100";
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
  const highestIndex = competitions.reduce<number>((currentHighest, competition) => {
    const numericPart = Number.parseInt(competition.id.replace("cmp-", ""), 10);

    if (Number.isNaN(numericPart)) {
      return currentHighest;
    }

    return Math.max(currentHighest, numericPart);
  }, 0);

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
    regStart: "2026-05-01",
    regEnd: "2026-05-15",
    eventStart: "2026-05-20",
    eventEnd: "2026-05-27",
    isPriority: false,
    hasGuidebook: false,
    description: "Tulis ringkasan kompetisi di sini.",
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

function hasGuidebookLink(competition: Competition): boolean {
  return Boolean(competition.links.guidebook?.trim());
}

function countActiveLinks(competition: Competition): number {
  return Object.values(competition.links).filter((value) => Boolean(value?.trim())).length;
}

function isCompetitionCategory(value: string): value is CompetitionCategory {
  return CATEGORY_OPTIONS.some((category) => category === value);
}

function validateCompetition(competition: Competition): string[] {
  const parsedResult = competitionSchema.safeParse(competition);

  if (parsedResult.success) {
    return [];
  }

  const uniqueMessages = new Set(parsedResult.error.issues.map((issue) => issue.message));

  return Array.from(uniqueMessages);
}

function serializeCompetitions(competitions: Competition[]): string {
  return JSON.stringify(competitions);
}

export function AdminCompetitionManager({
  initialCompetitions,
  dataStatusMessage = null,
}: AdminCompetitionManagerProps) {
  const [isMutationPending, startMutationTransition] = useTransition();
  const [competitions, setCompetitions] = useState<Competition[]>(initialCompetitions);
  const [savedCompetitions, setSavedCompetitions] = useState<Competition[]>(initialCompetitions);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>(
    initialCompetitions[0]?.id ?? "",
  );
  const [searchValue, setSearchValue] = useState<string>("");
  const [saveMessage, setSaveMessage] = useState<string>(
    "Belum ada perubahan baru yang disimpan di sesi browser ini.",
  );
  const deferredSearchValue = useDeferredValue(searchValue);
  const now = new Date();

  const filteredCompetitions = competitions.filter((competition) => {
    const query = normalizeSearchValue(deferredSearchValue);

    if (!query) {
      return true;
    }

    return [competition.name, competition.organizer, competition.category]
      .map((value) => normalizeSearchValue(value))
      .some((value) => value.includes(query));
  });

  const selectedCompetition =
    competitions.find((competition) => competition.id === selectedCompetitionId) ??
    competitions[0] ??
    null;

  const selectedSavedCompetition =
    savedCompetitions.find((competition) => competition.id === selectedCompetitionId) ?? null;

  const selectedValidationErrors = selectedCompetition ? validateCompetition(selectedCompetition) : [];
  const hasUnsavedChanges =
    serializeCompetitions(competitions) !== serializeCompetitions(savedCompetitions);

  const openCompetitions = competitions.filter(
    (competition) => getCompetitionStatus(competition, now) === "open",
  ).length;
  const closingSoonCompetitions = competitions.filter(
    (competition) => getCompetitionStatus(competition, now) === "closing-soon",
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

  const handleFieldChange = (field: EditableCompetitionField, value: string): void => {
    if (!selectedCompetition) {
      return;
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

      if (field === "name") {
        updatedCompetition.slug = createSlug(value, competition.id);
      }

      return updatedCompetition;
    });
  };

  const handleToggleChange = (field: "isPriority", value: boolean): void => {
    if (!selectedCompetition) {
      return;
    }

    updateCompetition(selectedCompetition.id, (competition) => ({
      ...competition,
      [field]: value,
    }));
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
        ? await updateCompetitionAction(selectedCompetitionIdValue, selectedCompetition)
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
          competition.id === persistedCompetition.id ? persistedCompetition : competition,
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
          competition.id === persistedCompetition.id ? persistedCompetition : competition,
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
    const nextCompetition = createEmptyCompetition(getNextCompetitionIndex(competitions));

    setCompetitions((currentCompetitions) => [nextCompetition, ...currentCompetitions]);
    setSelectedCompetitionId(nextCompetition.id);
    setSaveMessage(`Draft baru "${nextCompetition.name}" sudah ditambahkan dan siap dilengkapi.`);
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
    };

    duplicatedCompetition.slug = createSlug(duplicatedCompetition.name, duplicatedCompetition.id);

    setCompetitions((currentCompetitions) => [duplicatedCompetition, ...currentCompetitions]);
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
      setSaveMessage(`Draft "${selectedCompetition.name}" dibatalkan karena belum pernah disimpan.`);
      return;
    }

    updateCompetition(selectedCompetition.id, () => selectedSavedCompetition);
    setSaveMessage(`Perubahan pada "${selectedCompetition.name}" sudah dikembalikan ke versi tersimpan.`);
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
      setSaveMessage(`Draft "${selectedCompetitionName}" dibatalkan karena belum pernah dikirim ke backend.`);
      return;
    }

    startMutationTransition(async () => {
      const mutationResult = await deleteCompetitionAction(selectedCompetitionIdValue);

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
        currentCompetitions.filter((competition) => competition.id !== deletedId),
      );

      setSaveMessage(`"${selectedCompetitionName}" berhasil dihapus dari backend.`);
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
                <h1 className="font-brand text-[clamp(2.1rem,5vw,4rem)] leading-[0.98] text-zinc-50">
                  Kelola kompetisi dengan meja kerja yang lebih rapi.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                  Panel ini sekarang sudah diproteksi login admin dan dirapikan untuk mengelola detail lomba, jadwal, deskripsi, prioritas, dan tautan penting dengan lebih aman.
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

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-center backdrop-blur-md">
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Total data</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-50">{competitions.length}</p>
          </div>
          <div className="rounded-[1.25rem] border border-emerald-300/18 bg-emerald-300/10 px-5 py-4 text-center backdrop-blur-md">
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-100/75">Masih buka</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-50">{openCompetitions}</p>
          </div>
          <div className="rounded-[1.25rem] border border-amber-300/18 bg-amber-300/10 px-5 py-4 text-center backdrop-blur-md">
            <p className="text-[11px] uppercase tracking-[0.22em] text-amber-100/75">Deadline dekat</p>
            <p className="mt-2 text-3xl font-semibold text-amber-50">{closingSoonCompetitions}</p>
          </div>
          <div className="rounded-[1.25rem] border border-rose-300/18 bg-rose-300/10 px-5 py-4 text-center backdrop-blur-md">
            <p className="text-[11px] uppercase tracking-[0.22em] text-rose-100/75">Sudah tutup</p>
            <p className="mt-2 text-3xl font-semibold text-rose-50">{closedCompetitions}</p>
          </div>
        </section>

        {dataStatusMessage ? (
          <section className="rounded-[1.25rem] border border-amber-200/14 bg-amber-200/8 px-4 py-3 text-sm text-amber-50 backdrop-blur-md sm:px-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p>{dataStatusMessage}</p>
              <span className="text-xs uppercase tracking-[0.22em] text-amber-100/70">
                Sumber data lokal
              </span>
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.35fr)] xl:items-stretch">
          <aside className="flex min-h-0 flex-col rounded-[1.55rem] border border-white/10 bg-[oklch(0.16_0.02_250_/_0.88)] p-5 backdrop-blur-2xl sm:p-6">
            <div className="flex flex-col gap-4 border-b border-white/8 pb-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Daftar kompetisi</p>
                  <h2 className="mt-2 font-brand text-3xl text-zinc-50">Pilih data yang ingin diperbarui</h2>
                </div>
                <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
                  {filteredCompetitions.length} dari {competitions.length} data
                </div>
              </div>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-zinc-200">Cari kompetisi</span>
                <input
                  type="text"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Cari nama, penyelenggara, atau kategori"
                  className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 placeholder:text-zinc-500 focus:ring"
                />
              </label>
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
                          <p className="text-sm font-medium text-zinc-100">{competition.name}</p>
                          <p className="mt-1 text-xs text-zinc-500">{competition.organizer}</p>
                        </div>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${getStatusClassName(status)}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                        <span>{competition.category}</span>
                        <span>Deadline {formatDate(competition.regEnd)}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {competition.isPriority ? (
                          <span className="rounded-full border border-sky-300/18 bg-sky-300/10 px-2.5 py-1 text-[11px] text-sky-100">
                            Prioritas
                          </span>
                        ) : null}
                        {validationErrors.length > 0 ? (
                          <span className="rounded-full border border-rose-300/18 bg-rose-300/10 px-2.5 py-1 text-[11px] text-rose-100">
                            {validationErrors.length} catatan
                          </span>
                        ) : (
                          <span className="rounded-full border border-emerald-300/18 bg-emerald-300/10 px-2.5 py-1 text-[11px] text-emerald-100">
                            Data rapi
                          </span>
                        )}
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

          <section className="rounded-[1.55rem] border border-white/10 bg-[oklch(0.16_0.02_250_/_0.88)] p-5 backdrop-blur-2xl sm:p-6">
            {selectedCompetition ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-5 border-b border-white/8 pb-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Editor kompetisi</p>
                      <h2 className="mt-2 font-brand text-3xl text-zinc-50">{selectedCompetition.name}</h2>
                      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                        Perubahan tetap bisa ditinjau sebagai draft di editor, lalu dikirim ke backend lewat tombol simpan agar katalog publik dan panel admin selalu sinkron.
                      </p>
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
                    {isMutationPending ? "Sedang menyinkronkan perubahan ke backend..." : saveMessage}
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

                {selectedValidationErrors.length > 0 ? (
                  <section className="rounded-[1.25rem] border border-rose-300/16 bg-rose-300/10 p-4 text-sm text-rose-50">
                    <p className="font-medium">Data ini masih perlu dirapikan sebelum disimpan:</p>
                    <ul className="mt-3 grid gap-2 text-rose-100/90">
                      {selectedValidationErrors.map((errorMessage) => (
                        <li key={errorMessage}>• {errorMessage}</li>
                      ))}
                    </ul>
                  </section>
                ) : (
                  <section className="rounded-[1.25rem] border border-emerald-300/16 bg-emerald-300/10 p-4 text-sm text-emerald-50">
                    Data inti untuk kompetisi ini sudah rapi di level editor lokal.
                  </section>
                )}

                <div className="grid gap-6">
                  <section className="grid gap-4 lg:grid-cols-2">
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-zinc-200">Nama kompetisi</span>
                      <input
                        type="text"
                        value={selectedCompetition.name}
                        onChange={(event) => handleFieldChange("name", event.target.value)}
                        className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                      />
                    </label>

                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-zinc-200">Penyelenggara</span>
                      <input
                        type="text"
                        value={selectedCompetition.organizer}
                        onChange={(event) => handleFieldChange("organizer", event.target.value)}
                        className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                      />
                    </label>

                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-zinc-200">Kategori</span>
                      <div className="relative">
                        <select
                          value={selectedCompetition.category}
                          onChange={(event) => handleFieldChange("category", event.target.value)}
                          className="h-11 w-full appearance-none rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 pr-12 text-zinc-100 outline-none ring-amber-200/30 focus:ring [&>option]:bg-zinc-50 [&>option]:text-zinc-950"
                        >
                          {CATEGORY_OPTIONS.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-zinc-400">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M4 6.25L8 10.25L12 6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
                    <div className="lg:col-span-2">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Jadwal utama</p>
                    </div>

                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-zinc-200">Buka registrasi</span>
                      <input
                        type="date"
                        value={selectedCompetition.regStart}
                        onChange={(event) => handleFieldChange("regStart", event.target.value)}
                        className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                      />
                    </label>

                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-zinc-200">Tutup registrasi</span>
                      <input
                        type="date"
                        value={selectedCompetition.regEnd}
                        onChange={(event) => handleFieldChange("regEnd", event.target.value)}
                        className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                      />
                    </label>

                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-zinc-200">Mulai pelaksanaan</span>
                      <input
                        type="date"
                        value={selectedCompetition.eventStart}
                        onChange={(event) => handleFieldChange("eventStart", event.target.value)}
                        className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                      />
                    </label>

                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-zinc-200">Selesai pelaksanaan</span>
                      <input
                        type="date"
                        value={selectedCompetition.eventEnd}
                        onChange={(event) => handleFieldChange("eventEnd", event.target.value)}
                        className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                      />
                    </label>
                  </section>

                  <section className="grid gap-4 rounded-[1.3rem] border border-white/8 bg-white/[0.025] p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Deskripsi dan prioritas</p>
                        <h3 className="mt-2 text-lg font-semibold text-zinc-50">Rapikan konteks kompetisi</h3>
                      </div>
                      <label className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200">
                        <input
                          type="checkbox"
                          checked={selectedCompetition.isPriority}
                          onChange={(event) => handleToggleChange("isPriority", event.target.checked)}
                          className="h-4 w-4 rounded border-white/20 bg-transparent text-amber-200 focus:ring-amber-200/30"
                        />
                        Jadikan prioritas
                      </label>
                    </div>

                    <label className="grid gap-2 text-sm">
                      <span className="font-medium text-zinc-200">Deskripsi kompetisi</span>
                      <textarea
                        value={selectedCompetition.description}
                        onChange={(event) => handleFieldChange("description", event.target.value)}
                        rows={5}
                        className="rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 py-3 text-zinc-100 outline-none ring-amber-200/30 placeholder:text-zinc-500 focus:ring"
                      />
                    </label>
                  </section>

                  <section className="grid gap-4 rounded-[1.3rem] border border-white/8 bg-white/[0.025] p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Tautan kompetisi</p>
                        <h3 className="mt-2 text-lg font-semibold text-zinc-50">Perbarui link penting</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-xs font-semibold uppercase tracking-wide ${
                            hasGuidebookLink(selectedCompetition)
                              ? "border-emerald-300/22 bg-emerald-300/10 text-emerald-100"
                              : "border-white/10 bg-white/[0.03] text-zinc-300"
                          }`}
                        >
                          {hasGuidebookLink(selectedCompetition) ? "Guidebook aktif" : "Guidebook nonaktif"}
                        </span>
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
                          onChange={(event) => handleLinkChange("registration", event.target.value)}
                          className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                        />
                      </label>

                      <label className="grid gap-2 text-sm">
                        <span className="font-medium text-zinc-200">Link guidebook</span>
                        <input
                          type="url"
                          value={selectedCompetition.links.guidebook ?? ""}
                          onChange={(event) => handleLinkChange("guidebook", event.target.value)}
                          className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                        />
                      </label>

                      <label className="grid gap-2 text-sm">
                        <span className="font-medium text-zinc-200">Instagram</span>
                        <input
                          type="url"
                          value={selectedCompetition.links.instagram ?? ""}
                          onChange={(event) => handleLinkChange("instagram", event.target.value)}
                          className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                        />
                      </label>

                      <label className="grid gap-2 text-sm">
                        <span className="font-medium text-zinc-200">Linktree</span>
                        <input
                          type="url"
                          value={selectedCompetition.links.linktree ?? ""}
                          onChange={(event) => handleLinkChange("linktree", event.target.value)}
                          className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                        />
                      </label>

                      <label className="grid gap-2 text-sm lg:col-span-2">
                        <span className="font-medium text-zinc-200">Website resmi</span>
                        <input
                          type="url"
                          value={selectedCompetition.links.website ?? ""}
                          onChange={(event) => handleLinkChange("website", event.target.value)}
                          className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring"
                        />
                      </label>
                    </div>
                  </section>

                  <section className="grid gap-4 rounded-[1.3rem] border border-white/8 bg-white/[0.025] p-4 sm:p-5 lg:grid-cols-3">
                    <div className="rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Status</p>
                      <p className="mt-2 text-base font-semibold text-zinc-50">
                        {getStatusLabel(getCompetitionStatus(selectedCompetition, now))}
                      </p>
                    </div>
                    <div className="rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Pendaftaran</p>
                      <p className="mt-2 text-sm font-medium text-zinc-100">
                        {formatDateRange(selectedCompetition.regStart, selectedCompetition.regEnd)}
                      </p>
                    </div>
                    <div className="rounded-[1rem] border border-white/8 bg-black/10 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Pelaksanaan</p>
                      <p className="mt-2 text-sm font-medium text-zinc-100">
                        {formatDateRange(selectedCompetition.eventStart, selectedCompetition.eventEnd)}
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

        <section className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-zinc-400 backdrop-blur-md">
          Panel admin sekarang sudah bisa membaca dan memutasi data kompetisi lewat backend pada aksi simpan serta hapus. Jika backend tidak tersedia, pesan error akan muncul agar perbaikan bisa dilakukan segera.
        </section>
      </div>
    </main>
  );
}
