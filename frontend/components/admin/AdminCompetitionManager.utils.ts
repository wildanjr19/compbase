import { competitionSchema } from "@/lib/schemas";
import {
  COMPETITION_CATEGORIES,
  type Competition,
  type CompetitionCategory,
  type CompetitionStatus,
  type SubmissionStatus,
} from "@/lib/types";
import {
  getDaysUntilDeadline,
  getCompetitionStatus,
} from "@/lib/utils/competitions";

export type AdminPanelTab = "competitions" | "submissions";
export type AdminCompetitionStatusFilter = "all" | CompetitionStatus;

export type EditableCompetitionField =
  | "name"
  | "organizer"
  | "category"
  | "regStart"
  | "regEnd"
  | "eventStart"
  | "eventEnd";

export type EditableCompetitionLink =
  | "registration"
  | "guidebook"
  | "instagram"
  | "linktree"
  | "website";

export type EventDateMode = "single" | "range";

export const CATEGORY_OPTIONS: CompetitionCategory[] = [
  ...COMPETITION_CATEGORIES,
];
export const MAX_PRIORITY_COMPETITIONS = 3;

export function getStatusLabel(status: CompetitionStatus): string {
  if (status === "coming-soon") {
    return "Coming Soon";
  }

  if (status === "open") {
    return "Masih buka";
  }

  return "Sudah tutup";
}

export function getStatusClassName(status: CompetitionStatus): string {
  if (status === "coming-soon") {
    return "border-sky-300/24 bg-sky-300/10 text-sky-100";
  }

  if (status === "open") {
    return "border-emerald-300/24 bg-emerald-300/10 text-emerald-100";
  }

  return "border-rose-300/28 bg-rose-300/12 text-rose-100";
}

export function toAdminCompetitionStatusFilter(
  value: string,
): AdminCompetitionStatusFilter {
  if (value === "open" || value === "coming-soon" || value === "closed") {
    return value;
  }

  return "all";
}

export function getSubmissionStatusLabel(status: SubmissionStatus): string {
  if (status === "approved") {
    return "Disetujui";
  }

  if (status === "rejected") {
    return "Ditolak";
  }

  return "Menunggu review";
}

export function getSubmissionStatusClassName(status: SubmissionStatus): string {
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

export function comparePriorityCompetition(
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

export function formatDateTime(dateValue: string): string {
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

export function createSlug(name: string, id: string): string {
  const normalizedName = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return normalizedName ? normalizedName : `kompetisi-${id}`;
}

export function getNextCompetitionIndex(competitions: Competition[]): number {
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

export function createEmptyCompetition(nextIndex: number): Competition {
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

export function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

export function countActiveLinks(competition: Competition): number {
  return Object.values(competition.links).filter((value) =>
    Boolean(value?.trim()),
  ).length;
}

export function isCompetitionCategory(value: string): value is CompetitionCategory {
  return CATEGORY_OPTIONS.some((category) => category === value);
}

export function inferEventDateMode(competition: Competition): EventDateMode {
  if (
    competition.eventStart.trim() &&
    competition.eventEnd.trim() &&
    competition.eventStart !== competition.eventEnd
  ) {
    return "range";
  }

  return "single";
}

export function validateCompetition(competition: Competition): string[] {
  const parsedResult = competitionSchema.safeParse(competition);

  if (parsedResult.success) {
    return [];
  }

  const uniqueMessages = new Set(
    parsedResult.error.issues.map((issue) => issue.message),
  );

  return Array.from(uniqueMessages);
}

export function serializeCompetitions(competitions: Competition[]): string {
  return JSON.stringify(competitions);
}
