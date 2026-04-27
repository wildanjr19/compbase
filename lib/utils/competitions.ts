import type {
  Competition,
  CompetitionFilters,
  CompetitionSort,
  CompetitionStats,
  CompetitionStatus,
  CompetitionTab,
} from "@/lib/types";

const CLOSING_SOON_WINDOW_DAYS = 7;
const DEFAULT_FILTERS: CompetitionFilters = {
  query: "",
  organizer: "all",
  tab: "all",
  sort: "deadline",
};

type SearchParamValue = string | string[] | undefined;

function pickFirstValue(value: SearchParamValue): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0] ?? "";
  }

  return "";
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase();
}

function isCompetitionTab(value: string): value is CompetitionTab {
  return ["all", "open", "closing-soon", "priority", "has-guidebook"].includes(
    value,
  );
}

function isCompetitionSort(value: string): value is CompetitionSort {
  return ["deadline", "name", "organizer", "priority"].includes(value);
}

function toDate(dateInput: string): Date {
  return new Date(`${dateInput}T00:00:00.000Z`);
}

function toToday(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function parseCompetitionFilters(
  searchParams: Record<string, SearchParamValue>,
): CompetitionFilters {
  const query = pickFirstValue(searchParams.q);
  const organizer = pickFirstValue(searchParams.organizer);
  const tabInput = pickFirstValue(searchParams.tab);
  const sortInput = pickFirstValue(searchParams.sort);

  const normalizedTab = normalizeText(tabInput);
  const normalizedSort = normalizeText(sortInput);

  return {
    query,
    organizer: organizer ? organizer : DEFAULT_FILTERS.organizer,
    tab: isCompetitionTab(normalizedTab) ? normalizedTab : DEFAULT_FILTERS.tab,
    sort: isCompetitionSort(normalizedSort) ? normalizedSort : DEFAULT_FILTERS.sort,
  };
}

export function getDaysUntilDeadline(regEnd: string, now: Date): number {
  const deadline = toDate(regEnd);
  const today = toToday(now);
  const difference = deadline.getTime() - today.getTime();

  return Math.ceil(difference / (24 * 60 * 60 * 1000));
}

export function getCompetitionStatus(
  competition: Competition,
  now: Date,
): CompetitionStatus {
  const daysLeft = getDaysUntilDeadline(competition.regEnd, now);

  if (daysLeft < 0) {
    return "closed";
  }

  if (daysLeft <= CLOSING_SOON_WINDOW_DAYS) {
    return "closing-soon";
  }

  return "open";
}

export function formatDate(dateInput: string): string {
  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return formatter.format(toDate(dateInput));
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export function filterCompetitions(
  competitions: Competition[],
  filters: CompetitionFilters,
  now: Date,
): Competition[] {
  const normalizedQuery = normalizeText(filters.query);

  return competitions.filter((competition) => {
    if (normalizedQuery) {
      const matchesQuery = [
        competition.name,
        competition.organizer,
        competition.description,
      ]
        .map((text) => normalizeText(text))
        .some((text) => text.includes(normalizedQuery));

      if (!matchesQuery) {
        return false;
      }
    }

    if (filters.organizer !== "all" && competition.organizer !== filters.organizer) {
      return false;
    }

    const status = getCompetitionStatus(competition, now);

    if (filters.tab === "open" && status !== "open") {
      return false;
    }

    if (filters.tab === "closing-soon" && status !== "closing-soon") {
      return false;
    }

    if (filters.tab === "priority" && !competition.isPriority) {
      return false;
    }

    if (filters.tab === "has-guidebook" && !competition.hasGuidebook) {
      return false;
    }

    return true;
  });
}

export function sortCompetitions(
  competitions: Competition[],
  sort: CompetitionSort,
  now: Date,
): Competition[] {
  return [...competitions].sort((left, right) => {
    if (sort === "name") {
      return left.name.localeCompare(right.name, "id-ID");
    }

    if (sort === "organizer") {
      return left.organizer.localeCompare(right.organizer, "id-ID");
    }

    if (sort === "priority") {
      if (left.isPriority !== right.isPriority) {
        return left.isPriority ? -1 : 1;
      }

      return getDaysUntilDeadline(left.regEnd, now) - getDaysUntilDeadline(right.regEnd, now);
    }

    return getDaysUntilDeadline(left.regEnd, now) - getDaysUntilDeadline(right.regEnd, now);
  });
}

export function getCompetitionStats(
  competitions: Competition[],
  now: Date,
): CompetitionStats {
  return competitions.reduce<CompetitionStats>(
    (stats, competition) => {
      const status = getCompetitionStatus(competition, now);

      if (status === "open") {
        stats.open += 1;
      }

      if (status === "closing-soon") {
        stats.closingSoon += 1;
      }

      if (competition.isPriority) {
        stats.priority += 1;
      }

      stats.total += 1;
      return stats;
    },
    {
      total: 0,
      open: 0,
      closingSoon: 0,
      priority: 0,
    },
  );
}

export function getSpotlightCompetitions(
  competitions: Competition[],
  now: Date,
  limit = 3,
): Competition[] {
  const active = competitions.filter(
    (competition) => getCompetitionStatus(competition, now) !== "closed",
  );

  const sorted = [...active].sort((left, right) => {
    if (left.isPriority !== right.isPriority) {
      return left.isPriority ? -1 : 1;
    }

    const leftStatus = getCompetitionStatus(left, now);
    const rightStatus = getCompetitionStatus(right, now);

    if (leftStatus !== rightStatus) {
      return leftStatus === "closing-soon" ? -1 : 1;
    }

    return getDaysUntilDeadline(left.regEnd, now) - getDaysUntilDeadline(right.regEnd, now);
  });

  return sorted.slice(0, limit);
}

export function getOrganizerOptions(competitions: Competition[]): string[] {
  return Array.from(new Set(competitions.map((competition) => competition.organizer))).sort(
    (left, right) => left.localeCompare(right, "id-ID"),
  );
}

export function createCompetitionHref(
  filters: Partial<CompetitionFilters>,
): string {
  const params = new URLSearchParams();

  if (filters.query && filters.query.trim()) {
    params.set("q", filters.query.trim());
  }

  if (filters.organizer && filters.organizer !== "all") {
    params.set("organizer", filters.organizer);
  }

  if (filters.tab && filters.tab !== "all") {
    params.set("tab", filters.tab);
  }

  if (filters.sort && filters.sort !== "deadline") {
    params.set("sort", filters.sort);
  }

  const query = params.toString();

  if (!query) {
    return "/";
  }

  return `/?${query}`;
}