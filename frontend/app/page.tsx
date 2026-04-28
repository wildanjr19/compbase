import { CompetitionBrowser } from "@/components/CompetitionBrowser";
import { FilterBar } from "@/components/FilterBar";
import { HeroSection } from "@/components/HeroSection";
import Link from "next/link";
import type { CompetitionTab } from "@/lib/types";
import { getCompetitionsFromBackend } from "@/lib/utils/backend";
import {
  createCompetitionHref,
  filterCompetitions,
  getCategoryOptions,
  getCompetitionStats,
  getSpotlightCompetitions,
  parseCompetitionFilters,
  sortCompetitions,
} from "@/lib/utils/competitions";

interface HomePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const TAB_ITEMS: Array<{ label: string; value: CompetitionTab }> = [
  { label: "Semua", value: "all" },
  { label: "Coming Soon", value: "coming-soon" },
  { label: "Masih Buka", value: "open" },
];

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filters = parseCompetitionFilters(resolvedSearchParams);
  const now = new Date();
  const currentYear = now.getFullYear();
  const competitionResult = await getCompetitionsFromBackend();
  const allCompetitions = competitionResult.competitions;

  const competitions = sortCompetitions(
    filterCompetitions(allCompetitions, filters, now),
    filters.sort,
    now,
  );

  const tabLinks = TAB_ITEMS.map((item) => ({
    label: item.label,
    href: createCompetitionHref({
      query: filters.query,
      category: filters.category,
      sort: filters.sort,
      tab: item.value,
    }),
    isActive: filters.tab === item.value,
  }));

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-16rem] h-[34rem] w-[54rem] -translate-x-1/2 rounded-full bg-violet-300/10 blur-[130px]" />
        <div className="absolute left-[-14rem] top-[28%] h-[30rem] w-[30rem] rounded-full bg-indigo-400/10 blur-[145px]" />
        <div className="absolute right-[-12rem] top-[18%] h-[28rem] w-[28rem] rounded-full bg-fuchsia-300/9 blur-[145px]" />
        <div className="absolute bottom-[10%] right-[6%] h-[24rem] w-[24rem] rounded-full bg-cyan-300/7 blur-[135px]" />
      </div>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 md:gap-6 md:py-8 lg:px-8">
        <HeroSection
          stats={getCompetitionStats(allCompetitions, now)}
        />

        <CompetitionBrowser
          spotlightCompetitions={getSpotlightCompetitions(allCompetitions, now)}
          competitions={competitions}
          now={now}
          showGrid={false}
        />

        <section className="soft-panel rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-zinc-100 sm:text-[1.05rem]">
                Punya kompetisi yang belum ada di CompBase?
              </p>
              <p className="mt-1 text-base text-zinc-400">
                Ajukan kompetisimu untuk direview admin sebelum masuk katalog publik.
              </p>
            </div>

            <Link
              href="/ajukan-kompetisi"
              className="inline-flex h-12 items-center justify-center rounded-full border border-amber-200/20 bg-amber-200/12 px-5 text-base font-semibold text-amber-100 transition hover:border-amber-200/30 hover:bg-amber-200/20"
            >
              Mau Tambah Kompetisimu?
            </Link>
          </div>
        </section>

        {competitionResult.errorMessage ? (
          <section className="soft-panel rounded-[1.25rem] border border-amber-200/14 bg-amber-200/8 px-4 py-3 text-sm text-amber-50 sm:px-5">
            <p>{competitionResult.errorMessage}</p>
          </section>
        ) : null}

        <FilterBar
          key={`filter-${createCompetitionHref(filters)}`}
          query={filters.query}
          category={filters.category}
          sort={filters.sort}
          activeTab={filters.tab}
          categories={getCategoryOptions(allCompetitions)}
          tabLinks={tabLinks}
          clearHref={createCompetitionHref({})}
        />

        <CompetitionBrowser
          key={`grid-${createCompetitionHref(filters)}`}
          spotlightCompetitions={getSpotlightCompetitions(allCompetitions, now)}
          competitions={competitions}
          now={now}
          showSpotlight={false}
        />

        <footer className="rounded-[1.3rem] px-1 py-5 text-sm text-zinc-400 md:px-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-zinc-200">CompBase</p>
              <p className="mt-1">(c) {currentYear} CompBase. Semua hak cipta dilindungi.</p>
            </div>

            <a
              href="/admin"
              className="inline-flex h-10 items-center justify-center rounded-full border border-violet-200/14 bg-white/[0.045] px-4 text-sm font-medium text-zinc-100 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.06)] hover:border-violet-200/28 hover:bg-violet-200/9 hover:text-white"
            >
              Admin
            </a>
          </div>
        </footer>
      </main>

    </div>
  );
}
