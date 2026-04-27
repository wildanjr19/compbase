import { CompetitionGrid } from "@/components/CompetitionGrid";
import { FilterBar } from "@/components/FilterBar";
import { HeroSection } from "@/components/HeroSection";
import { SpotlightSection } from "@/components/SpotlightSection";
import { COMPETITIONS } from "@/lib/data/competitions";
import type { CompetitionTab } from "@/lib/types";
import {
  createCompetitionHref,
  filterCompetitions,
  getCompetitionStats,
  getOrganizerOptions,
  getSpotlightCompetitions,
  parseCompetitionFilters,
  sortCompetitions,
} from "@/lib/utils/competitions";

interface HomePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const TAB_ITEMS: Array<{ label: string; value: CompetitionTab }> = [
  { label: "Semua", value: "all" },
  { label: "Masih Buka", value: "open" },
  { label: "Deadline Dekat", value: "closing-soon" },
  { label: "Prioritas", value: "priority" },
  { label: "Ada Guidebook", value: "has-guidebook" },
];

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filters = parseCompetitionFilters(resolvedSearchParams);
  const now = new Date();

  const competitions = sortCompetitions(
    filterCompetitions(COMPETITIONS, filters, now),
    filters.sort,
    now,
  );

  const tabLinks = TAB_ITEMS.map((item) => ({
    label: item.label,
    href: createCompetitionHref({
      query: filters.query,
      organizer: filters.organizer,
      sort: filters.sort,
      tab: item.value,
    }),
    isActive: filters.tab === item.value,
  }));

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-300/10 to-transparent" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <HeroSection
          stats={getCompetitionStats(COMPETITIONS, now)}
          visibleCount={competitions.length}
        />

        <FilterBar
          query={filters.query}
          organizer={filters.organizer}
          sort={filters.sort}
          organizers={getOrganizerOptions(COMPETITIONS)}
          tabLinks={tabLinks}
          clearHref={createCompetitionHref({})}
        />

        <SpotlightSection competitions={getSpotlightCompetitions(COMPETITIONS, now)} now={now} />
        <CompetitionGrid competitions={competitions} now={now} />
      </main>
    </div>
  );
}
