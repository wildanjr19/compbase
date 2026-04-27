"use client";

import { useActionState } from "react";
import {
  INITIAL_ADMIN_LOGIN_STATE,
  loginAdminAction,
  type AdminLoginState,
} from "@/app/admin/actions";

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState<AdminLoginState, FormData>(
    loginAdminAction,
    INITIAL_ADMIN_LOGIN_STATE,
  );

  return (
    <form action={formAction} className="mt-8 grid gap-4">
      <label className="grid gap-2 text-sm">
        <span className="font-medium text-zinc-200">Email admin</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="admin@compbase.id"
          className="h-12 rounded-[1.1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/35 placeholder:text-zinc-500 focus:ring"
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-medium text-zinc-200">Kata sandi</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Masukkan kata sandi"
          className="h-12 rounded-[1.1rem] border border-white/10 bg-white/[0.045] px-4 text-zinc-100 outline-none ring-amber-200/35 placeholder:text-zinc-500 focus:ring"
        />
      </label>

      {state.errorMessage ? (
        <div className="rounded-[1rem] border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          {state.errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 inline-flex h-12 items-center justify-center rounded-[1.1rem] bg-amber-200 px-5 text-sm font-semibold text-zinc-950 shadow-[0_22px_45px_-28px_oklch(0.82_0.07_85)] transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Memeriksa akses..." : "Masuk ke panel"}
      </button>
    </form>
  );
}
