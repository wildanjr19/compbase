"use client";

import { useActionState, useState, type ReactElement } from "react";
import {
  submitCompetitionProposalAction,
  type SubmissionFormState,
} from "@/app/ajukan-kompetisi/actions";
import { COMPETITION_CATEGORIES, type CompetitionCategory } from "@/lib/types";

const INITIAL_FORM_STATE: SubmissionFormState = {
  ok: false,
  successMessage: null,
  errorMessage: null,
};

function isCompetitionCategory(value: string): value is CompetitionCategory {
  return COMPETITION_CATEGORIES.some((category) => category === value);
}

export function SubmitForm(): ReactElement {
  const [selectedCategory, setSelectedCategory] =
    useState<CompetitionCategory>("Data Science");
  const [eventDateMode, setEventDateMode] = useState<"single" | "range">(
    "range",
  );
  const [state, formAction, isPending] = useActionState<SubmissionFormState, FormData>(
    submitCompetitionProposalAction,
    INITIAL_FORM_STATE,
  );

  const isSingleEventDate = eventDateMode === "single";

  const handleCategoryChange = (value: string): void => {
    if (!isCompetitionCategory(value)) {
      return;
    }

    setSelectedCategory(value);

    if (value === "Olympiad") {
      setEventDateMode("single");
    }
  };

  return (
    <form action={formAction} className="grid gap-5">
      <input
        type="text"
        name="websiteToken"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-zinc-200">Nama kompetisi</span>
          <input
            type="text"
            name="name"
            required
            className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 placeholder:text-zinc-500 focus:ring"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-zinc-200">Penyelenggara</span>
          <input
            type="text"
            name="organizer"
            required
            className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 placeholder:text-zinc-500 focus:ring"
          />
        </label>

        <label className="grid gap-2 text-sm sm:col-span-2">
          <span className="font-medium text-zinc-200">Kategori</span>
          <select
            name="category"
            value={selectedCategory}
            onChange={(event) => handleCategoryChange(event.target.value)}
            className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring [&>option]:bg-zinc-900"
          >
            {COMPETITION_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-start justify-between gap-3 sm:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
            Jadwal utama
          </p>
          <button
            type="button"
            onClick={() =>
              setEventDateMode(isSingleEventDate ? "range" : "single")
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
          <span className="font-medium text-zinc-200">Buka registrasi</span>
          <input type="date" name="regStart" className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring [color-scheme:dark]" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-zinc-200">Tutup registrasi</span>
          <input type="date" name="regEnd" className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring [color-scheme:dark]" />
        </label>

        <input type="hidden" name="eventDateMode" value={eventDateMode} />

        <label className={`grid gap-2 text-sm ${isSingleEventDate ? "sm:col-span-2" : ""}`}>
          <span className="font-medium text-zinc-200">
            {isSingleEventDate ? "Tanggal penyisihan" : "Mulai penyisihan"}
          </span>
          <input type="date" name="eventStart" className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring [color-scheme:dark]" />
        </label>

        {isSingleEventDate ? (
          <input type="hidden" name="eventEnd" value="" />
        ) : (
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-zinc-200">Selesai penyisihan</span>
            <input type="date" name="eventEnd" className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring [color-scheme:dark]" />
          </label>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-zinc-200">Link registrasi</span>
          <input type="url" name="registration" placeholder="https://" className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 placeholder:text-zinc-500 focus:ring" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-zinc-200">Link guidebook</span>
          <input type="url" name="guidebook" placeholder="https://" className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 placeholder:text-zinc-500 focus:ring" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-zinc-200">Instagram</span>
          <input type="url" name="instagram" placeholder="https://" className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 placeholder:text-zinc-500 focus:ring" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-zinc-200">Linktree</span>
          <input type="url" name="linktree" placeholder="https://" className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 placeholder:text-zinc-500 focus:ring" />
        </label>
        <label className="grid gap-2 text-sm sm:col-span-2">
          <span className="font-medium text-zinc-200">Website resmi</span>
          <input type="url" name="website" placeholder="https://" className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 placeholder:text-zinc-500 focus:ring" />
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-zinc-200">Nama pengaju</span>
          <input
            type="text"
            name="submitterName"
            required
            className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 placeholder:text-zinc-500 focus:ring"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-zinc-200">Email pengaju</span>
          <input
            type="email"
            name="submitterEmail"
            required
            className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 placeholder:text-zinc-500 focus:ring"
          />
        </label>

        <label className="grid gap-2 text-sm sm:col-span-2">
          <span className="font-medium text-zinc-200">Catatan tambahan</span>
          <textarea
            name="notes"
            rows={4}
            className="rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 py-3 text-zinc-100 outline-none ring-amber-200/30 placeholder:text-zinc-500 focus:ring"
            placeholder="Opsional. Misalnya: benefit peserta, jadwal rilis guidebook, atau kanal kontak panitia."
          />
        </label>
      </section>

      {state.errorMessage ? (
        <div className="rounded-[1rem] border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          {state.errorMessage}
        </div>
      ) : null}

      {state.successMessage ? (
        <div className="rounded-[1rem] border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
          {state.successMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-12 items-center justify-center rounded-[1.1rem] bg-amber-200 px-6 text-sm font-semibold text-zinc-950 shadow-[0_22px_45px_-28px_oklch(0.82_0.07_85)] transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Mengirim pengajuan..." : "Ajukan kompetisi"}
      </button>
    </form>
  );
}
