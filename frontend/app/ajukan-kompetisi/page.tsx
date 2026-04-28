import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { SubmitForm } from "@/app/ajukan-kompetisi/SubmitForm";

export const metadata: Metadata = {
  title: "Ajukan Kompetisi | CompBase",
  description:
    "Ajukan kompetisi Anda ke CompBase agar bisa direview admin dan ditampilkan di katalog.",
};

interface SubmissionPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickFirstValue(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0] ?? "";
  }

  return "";
}

export default async function SubmissionPage({
  searchParams,
}: SubmissionPageProps): Promise<ReactElement> {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const status = pickFirstValue(resolvedSearchParams.status);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-12rem] h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-amber-300/10 blur-[130px]" />
        <div className="absolute left-[-10rem] top-[35%] h-[24rem] w-[24rem] rounded-full bg-emerald-300/10 blur-[140px]" />
        <div className="absolute right-[-10rem] top-[10%] h-[24rem] w-[24rem] rounded-full bg-sky-300/10 blur-[135px]" />
      </div>

      <section className="relative mx-auto w-full max-w-4xl rounded-[1.8rem] border border-white/10 bg-[oklch(0.16_0.02_250_/_0.9)] p-5 shadow-[0_30px_90px_-55px_oklch(0.05_0.03_250)] backdrop-blur-2xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-200">
            Pengajuan Publik
          </span>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-100 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            Kembali ke beranda
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          <h1 className="font-brand text-[clamp(2rem,6vw,3.4rem)] leading-[1] text-zinc-50">
            Mau tambah kompetisimu?
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            Isi data kompetisi melalui form ini. Pengajuan akan direview dulu oleh admin
            sebelum masuk ke katalog publik CompBase.
          </p>
        </div>

        {status === "terkirim" ? (
          <div className="mt-6 rounded-[1rem] border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            Pengajuan berhasil dikirim. Tim admin akan meninjau data Anda sebelum dipublikasikan.
          </div>
        ) : null}

        <div className="mt-6 rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <SubmitForm />
        </div>
      </section>
    </main>
  );
}
