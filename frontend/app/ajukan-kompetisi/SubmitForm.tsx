"use client";

import { useActionState } from "react";
import {
  submitCompetitionProposalAction,
  type SubmissionFormState,
} from "@/app/ajukan-kompetisi/actions";

const INITIAL_FORM_STATE: SubmissionFormState = {
  errorMessage: null,
};

const CATEGORY_OPTIONS = [
  "Dashboard",
  "Data Mining",
  "Data Science",
  "Datathon",
  "Essay",
  "Hackathon",
  "Infografis",
  "LKTI",
  "Olympiad",
] as const;

export function SubmitForm(): JSX.Element {
  const [state, formAction, isPending] = useActionState<SubmissionFormState, FormData>(
    submitCompetitionProposalAction,
    INITIAL_FORM_STATE,
  );

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
            defaultValue="Data Science"
            className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring [&>option]:bg-zinc-900"
          >
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-zinc-200">Buka registrasi</span>
          <input type="date" name="regStart" className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring [color-scheme:dark]" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-zinc-200">Tutup registrasi</span>
          <input type="date" name="regEnd" className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring [color-scheme:dark]" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-zinc-200">Mulai penyisihan</span>
          <input type="date" name="eventStart" className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring [color-scheme:dark]" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-zinc-200">Selesai penyisihan</span>
          <input type="date" name="eventEnd" className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/30 focus:ring [color-scheme:dark]" />
        </label>
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
