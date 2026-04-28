import {
  COMPETITION_CATEGORIES,
  type Competition,
  type CompetitionCategory,
  type CompetitionFilters,
  type CompetitionSort,
  type CompetitionStats,
  type CompetitionStatus,
  type CompetitionTab,
} from "@/lib/types";

const DEFAULT_FILTERS: CompetitionFilters = {
  query: "",
  category: "all",
  tab: "all",
  sort: "deadline",
  page: 1,
};

type SearchParamValue = string | string[] | undefined;

const LEGACY_CATEGORY_LABEL_MAP: Record<string, CompetitionCategory> = {
  infografis: "Infographics",
};

const CATEGORY_SEARCH_ALIASES: Record<string, string[]> = {
  infographics: ["Infografis"],
};

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

function normalizeCategoryLabel(category: string): string {
  const trimmedCategory = category.trim();

  if (!trimmedCategory) {
    return "";
  }

  const normalizedCategory = normalizeText(trimmedCategory);
  const mappedCategory = LEGACY_CATEGORY_LABEL_MAP[normalizedCategory];

  if (mappedCategory) {
    return mappedCategory;
  }

  return trimmedCategory;
}

function getCategorySearchTerms(category: string): string[] {
  const normalizedCategory = normalizeCategoryLabel(category);
  const aliases =
    CATEGORY_SEARCH_ALIASES[normalizeText(normalizedCategory)] ?? [];

  return [normalizedCategory, ...aliases];
}

function isCompetitionTab(value: string): value is CompetitionTab {
  return ["all", "coming-soon", "open"].includes(value);
}

function isCompetitionSort(value: string): value is CompetitionSort {
  return ["deadline", "name"].includes(value);
}

function parsePageValue(value: SearchParamValue): number {
  const rawPage = pickFirstValue(value).trim();
  const parsedPage = Number.parseInt(rawPage, 10);

  if (Number.isNaN(parsedPage) || parsedPage < 1) {
    return DEFAULT_FILTERS.page;
  }

  return parsedPage;
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
  const rawCategory = pickFirstValue(searchParams.category);
  const category = normalizeCategoryLabel(rawCategory);
  const tabInput = pickFirstValue(searchParams.tab);
  const sortInput = pickFirstValue(searchParams.sort);
  const page = parsePageValue(searchParams.page);

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
    page,
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

  if (hasDate(startDate) && !hasDate(endDate)) {
    return formatDate(startDate);
  }

  if (!hasDate(startDate) && hasDate(endDate)) {
    return formatDate(endDate);
  }

  if (!hasDate(startDate) || !hasDate(endDate)) {
    return "Menunggu jadwal lengkap";
  }

  if (startDate === endDate) {
    return formatDate(startDate);
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
    const competitionCategory = normalizeCategoryLabel(competition.category);

    if (normalizedQuery) {
      const matchesQuery = [
        competition.name,
        competition.organizer,
        ...getCategorySearchTerms(competitionCategory),
      ]
        .map((text) => normalizeText(text))
        .some((text) => text.includes(normalizedQuery));

      if (!matchesQuery) {
        return false;
      }
    }

    if (
      filters.category !== "all" &&
      competitionCategory !== filters.category
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
  const nonClosedCompetitions = competitions.filter(
    (competition) => getCompetitionStatus(competition, now) !== "closed",
  );
  const priorityCompetitions = nonClosedCompetitions.filter(
    (competition) => competition.isPriority,
  );
  const fallbackCompetitions = nonClosedCompetitions.filter(
    (competition) => getCompetitionStatus(competition, now) === "open",
  );

  const spotlightSource =
    priorityCompetitions.length > 0
      ? priorityCompetitions
      : fallbackCompetitions.length > 0
        ? fallbackCompetitions
        : nonClosedCompetitions;

  const sorted = [...spotlightSource].sort((left, right) => {
    const leftStatus = getCompetitionStatus(left, now);
    const rightStatus = getCompetitionStatus(right, now);

    if (leftStatus !== rightStatus) {
      if (leftStatus === "open") {
        return -1;
      }

      if (rightStatus === "open") {
        return 1;
      }
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
  const allCategories = new Set<string>(COMPETITION_CATEGORIES);

  competitions.forEach((competition) => {
    allCategories.add(normalizeCategoryLabel(competition.category));
  });

  return Array.from(allCategories).sort((left, right) =>
    left.localeCompare(right, "id-ID"),
  );
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

  if (typeof filters.page === "number" && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  const query = params.toString();

  if (!query) {
    return "/";
  }

  return `/?${query}`;
}

export function clampCompetitionPage(
  requestedPage: number,
  totalItems: number,
  pageSize: number,
): number {
  const safeRequestedPage = Number.isFinite(requestedPage)
    ? Math.max(1, Math.floor(requestedPage))
    : 1;
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));

  return Math.min(safeRequestedPage, totalPages);
}
