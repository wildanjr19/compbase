"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { CompetitionSort, CompetitionTab } from "@/lib/types";
import { createCompetitionHref } from "@/lib/utils/competitions";

interface FilterTabItem {
  label: string;
  href: string;
  isActive: boolean;
}

interface FilterBarProps {
  query: string;
  category: string;
  sort: CompetitionSort;
  activeTab: CompetitionTab;
  categories: string[];
  tabLinks: FilterTabItem[];
  clearHref: string;
}

const SEARCH_DEBOUNCE_DELAY_MS = 360;

function toCompetitionSort(value: FormDataEntryValue | null): CompetitionSort {
  if (value === "name") {
    return value;
  }

  return "deadline";
}

function toCompetitionTab(value: FormDataEntryValue | null): CompetitionTab {
  if (value === "open" || value === "coming-soon") {
    return value;
  }

  if (value === "closing-soon") {
    return "coming-soon";
  }

  return "all";
}

export function FilterBar({
  query,
  category,
  sort,
  activeTab,
  categories,
  tabLinks,
  clearHref,
}: FilterBarProps) {
  const router = useRouter();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [queryValue, setQueryValue] = useState<string>(query);
  const [isPending, startTransition] = useTransition();

  const clearDebounceTimer = (): void => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  };

  const navigateWithFilters = (form: HTMLFormElement): void => {
    clearDebounceTimer();

    const formData = new FormData(form);
    const nextHref = createCompetitionHref({
      query: String(formData.get("q") ?? ""),
      category: String(formData.get("category") ?? "all"),
      sort: toCompetitionSort(formData.get("sort")),
      tab: toCompetitionTab(formData.get("tab")),
    });

    startTransition(() => {
      router.push(nextHref);
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    navigateWithFilters(event.currentTarget);
  };

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const nextQuery = event.currentTarget.value;
    const parentForm = event.currentTarget.form;

    setQueryValue(nextQuery);

    if (!parentForm) {
      return;
    }

    // Timer ini menjaga pencarian tetap ringan saat user masih mengetik.
    clearDebounceTimer();
    debounceTimerRef.current = setTimeout(() => {
      navigateWithFilters(parentForm);
    }, SEARCH_DEBOUNCE_DELAY_MS);
  };

  const handleSelectChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ): void => {
    const parentForm = event.currentTarget.form;

    if (!parentForm) {
      return;
    }

    navigateWithFilters(parentForm);
  };

  return (
    <section className="reveal-up reveal-delay-1 soft-panel rounded-[1.5rem] border border-white/[0.04] bg-white/[0.018] p-4 backdrop-blur-xl md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabLinks.map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              className={`inline-flex min-h-10 items-center rounded-full border px-4 py-2 text-sm font-medium ${
                tab.isActive
                  ? "border-violet-300/26 bg-violet-300/10 text-violet-100"
                  : "border-white/7 bg-white/[0.025] text-zinc-300 hover:border-white/14 hover:text-zinc-100"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="min-h-5 text-xs text-zinc-400">
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-200/80 animate-pulse" />
              Memperbarui hasil...
            </span>
          ) : null}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_auto]"
      >
        <input type="hidden" name="tab" value={activeTab} />

        <label className="grid gap-1.5 text-base">
          <span className="text-[15px] font-semibold text-zinc-200">Cari lomba</span>
          <span className="text-sm text-zinc-500">Bisa pakai nama lomba atau topik</span>
          <input
            type="text"
            name="q"
            value={queryValue}
            onChange={handleQueryChange}
            placeholder="Contoh: datathon, AI, dashboard"
            className="h-12 rounded-[1.05rem] border border-white/8 bg-white/[0.04] px-4 text-base text-zinc-100 outline-none ring-violet-300/35 focus:ring"
          />
        </label>

        <label className="grid gap-1.5 text-base">
          <span className="text-[15px] font-semibold text-zinc-200">Kategori lomba</span>
          <span className="text-sm text-zinc-500">Pilih tipe lomba yang kamu cari</span>
          <div className="relative">
            <select
              name="category"
              defaultValue={category}
              onChange={handleSelectChange}
              className="h-12 w-full appearance-none rounded-[1.05rem] border border-white/8 bg-white/[0.04] px-4 pr-12 text-base text-zinc-100 outline-none ring-violet-300/35 focus:ring [&>option]:bg-zinc-50 [&>option]:text-zinc-950"
            >
              <option value="all">Semua kategori</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
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

        <label className="grid gap-1.5 text-base">
          <span className="text-[15px] font-semibold text-zinc-200">Urutkan</span>
          <span className="text-sm text-zinc-500">Biar hasilnya enak dibaca</span>
          <div className="relative">
            <select
              name="sort"
              defaultValue={sort}
              onChange={handleSelectChange}
              className="h-12 w-full appearance-none rounded-[1.05rem] border border-white/8 bg-white/[0.04] px-4 pr-12 text-base text-zinc-100 outline-none ring-violet-300/35 focus:ring [&>option]:bg-zinc-50 [&>option]:text-zinc-950"
            >
              <option value="deadline">Deadline pendaftaran</option>
              <option value="name">Nama A-Z</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-zinc-400">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 6.25L8 10.25L12 6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </label>

        <div className="flex flex-wrap items-end gap-3">
          <button
            type="submit"
            className="inline-flex h-12 min-w-28 items-center justify-center rounded-[1.05rem] bg-violet-200/88 px-5 text-base font-semibold text-zinc-950 shadow-[0_18px_42px_-28px_oklch(0.76_0.08_302)] hover:bg-violet-200"
          >
            Cari
          </button>

          <button
            type="button"
            onClick={() => {
              startTransition(() => {
                router.push(clearHref);
              });
            }}
            className="inline-flex h-12 items-center justify-center rounded-[1.05rem] border border-white/8 px-5 text-base font-medium text-zinc-300 hover:border-white/15 hover:text-zinc-50"
          >
            Reset
          </button>
        </div>
      </form>
    </section>
  );
}
