import type { CompetitionSort } from "@/lib/types";

interface FilterTabItem {
  label: string;
  href: string;
  isActive: boolean;
}

interface FilterBarProps {
  query: string;
  organizer: string;
  sort: CompetitionSort;
  organizers: string[];
  tabLinks: FilterTabItem[];
  clearHref: string;
}

export function FilterBar({
  query,
  organizer,
  sort,
  organizers,
  tabLinks,
  clearHref,
}: FilterBarProps) {
  return (
    <section className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl shadow-zinc-950/50">
      <div className="flex flex-wrap gap-2">
        {tabLinks.map((tab) => (
          <a
            key={tab.label}
            href={tab.href}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              tab.isActive
                ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-100"
                : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <form action="/" method="get" className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto_auto]">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-zinc-300">Cari Kompetisi</span>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Contoh: datathon, klimat, AI"
            className="h-11 rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 text-zinc-100 outline-none ring-emerald-300/60 transition focus:ring"
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-zinc-300">Penyelenggara</span>
          <select
            name="organizer"
            defaultValue={organizer}
            className="h-11 rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 text-zinc-100 outline-none ring-emerald-300/60 transition focus:ring"
          >
            <option value="all">Semua Penyelenggara</option>
            {organizers.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-zinc-300">Urutkan</span>
          <select
            name="sort"
            defaultValue={sort}
            className="h-11 rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 text-zinc-100 outline-none ring-emerald-300/60 transition focus:ring"
          >
            <option value="deadline">Deadline Terdekat</option>
            <option value="priority">Prioritas Dulu</option>
            <option value="name">Nama A-Z</option>
          </select>
        </label>

        <button
          type="submit"
          className="h-11 self-end rounded-xl bg-emerald-300/85 px-4 text-sm font-semibold text-zinc-900 transition hover:bg-emerald-200"
        >
          Terapkan
        </button>

        <a
          href={clearHref}
          className="inline-flex h-11 items-center justify-center self-end rounded-xl border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-50"
        >
          Reset
        </a>
      </form>
    </section>
  );
}
