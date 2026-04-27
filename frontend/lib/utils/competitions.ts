import type {
  Competition,
  CompetitionFilters,
  CompetitionSort,
  CompetitionStats,
  CompetitionStatus,
  CompetitionTab,
} from "@/lib/types";

const DEFAULT_FILTERS: CompetitionFilters = {
  query: "",
  category: "all",
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
  return ["all", "coming-soon", "open"].includes(value);
}

function isCompetitionSort(value: string): value is CompetitionSort {
  return ["deadline", "name"].includes(value);
}

function getCompetitionStatusOrder(status: CompetitionStatus): number {
  const statusOrder: Record<CompetitionStatus, number> = {
    open: 0,
    "coming-soon": 1,
    closed: 2,
  };

  return statusOrder[status];
}

function toDate(dateInput: string): Date {
  return new Date(`${dateInput}T00:00:00.000Z`);
}

function hasDate(dateInput: string): boolean {
  return Boolean(dateInput?.trim());
}

function toToday(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export function parseCompetitionFilters(
  searchParams: Record<string, SearchParamValue>,
): CompetitionFilters {
  const query = pickFirstValue(searchParams.q);
  const category = pickFirstValue(searchParams.category);
  const tabInput = pickFirstValue(searchParams.tab);
  const sortInput = pickFirstValue(searchParams.sort);

  const normalizedTab = normalizeText(tabInput);
  const normalizedSort = normalizeText(sortInput);
  const resolvedTab =
    normalizedTab === "closing-soon" ? "coming-soon" : normalizedTab;

  return {
    query,
    category: category ? category : DEFAULT_FILTERS.category,
    tab: isCompetitionTab(resolvedTab) ? resolvedTab : DEFAULT_FILTERS.tab,
    sort: isCompetitionSort(normalizedSort)
      ? normalizedSort
      : DEFAULT_FILTERS.sort,
  };
}

export function getDaysUntilDeadline(regEnd: string, now: Date): number | null {
  if (!hasDate(regEnd)) {
    return null;
  }

  const deadline = toDate(regEnd);
  const today = toToday(now);
  const difference = deadline.getTime() - today.getTime();

  return Math.ceil(difference / (24 * 60 * 60 * 1000));
}

export function getCompetitionStatus(
  competition: Competition,
  now: Date,
): CompetitionStatus {
  if (!hasDate(competition.regStart) || !hasDate(competition.regEnd)) {
    return "coming-soon";
  }

  const registrationStartDate = toDate(competition.regStart);
  const today = toToday(now);

  if (registrationStartDate.getTime() > today.getTime()) {
    return "coming-soon";
  }

  const daysLeft = getDaysUntilDeadline(competition.regEnd, now);

  if (daysLeft === null) {
    return "coming-soon";
  }

  if (daysLeft < 0) {
    return "closed";
  }

  return "open";
}

export function formatDate(dateInput: string): string {
  if (!hasDate(dateInput)) {
    return "Belum ditentukan";
  }

  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return formatter.format(toDate(dateInput));
}

export function formatDateRange(startDate: string, endDate: string): string {
  if (!hasDate(startDate) && !hasDate(endDate)) {
    return "Belum ditentukan";
  }

  if (!hasDate(startDate) || !hasDate(endDate)) {
    return "Menunggu jadwal lengkap";
  }

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
        competition.category,
      ]
        .map((text) => normalizeText(text))
        .some((text) => text.includes(normalizedQuery));

      if (!matchesQuery) {
        return false;
      }
    }

    if (
      filters.category !== "all" &&
      competition.category !== filters.category
    ) {
      return false;
    }

    const status = getCompetitionStatus(competition, now);

    if (filters.tab === "coming-soon" && status !== "coming-soon") {
      return false;
    }

    if (filters.tab === "open" && status !== "open") {
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
    const leftStatus = getCompetitionStatus(left, now);
    const rightStatus = getCompetitionStatus(right, now);

    if (leftStatus !== rightStatus) {
      return getCompetitionStatusOrder(leftStatus) - getCompetitionStatusOrder(rightStatus);
    }

    if (sort === "name") {
      return left.name.localeCompare(right.name, "id-ID");
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

    return rightDays - leftDays;
  });
}

export function getCompetitionStats(
  competitions: Competition[],
  now: Date,
): CompetitionStats {
  return competitions.reduce<CompetitionStats>(
    (stats, competition) => {
      const status = getCompetitionStatus(competition, now);

      if (status === "coming-soon") {
        stats.comingSoon += 1;
      }

      if (status === "open") {
        stats.open += 1;
      }

      if (competition.isPriority) {
        stats.priority += 1;
      }

      stats.total += 1;
      return stats;
    },
    {
      total: 0,
      comingSoon: 0,
      open: 0,
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
      return getCompetitionStatusOrder(leftStatus) - getCompetitionStatusOrder(rightStatus);
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
  });

  return sorted.slice(0, limit);
}

export function getCategoryOptions(competitions: Competition[]): string[] {
  return Array.from(
    new Set(competitions.map((competition) => competition.category)),
  ).sort((left, right) => left.localeCompare(right, "id-ID"));
}

export function createCompetitionHref(
  filters: Partial<CompetitionFilters>,
): string {
  const params = new URLSearchParams();

  if (filters.query && filters.query.trim()) {
    params.set("q", filters.query.trim());
  }

  if (filters.category && filters.category !== "all") {
    params.set("category", filters.category);
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
