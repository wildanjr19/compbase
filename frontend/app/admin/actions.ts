"use server";

import { redirect } from "next/navigation";
import { competitionSchema } from "@/lib/schemas";
import type { Competition } from "@/lib/types";
import {
  createCompetitionInBackend,
  deleteCompetitionFromBackend,
  updateCompetitionInBackend,
} from "@/lib/utils/backend";
import {
  clearAdminSession,
  createAdminSession,
  requireAdminSession,
  validateAdminCredentials,
} from "@/lib/auth";

export interface AdminLoginState {
  errorMessage: string | null;
}

export const INITIAL_ADMIN_LOGIN_STATE: AdminLoginState = {
  errorMessage: null,
};

export interface AdminCompetitionMutationState {
  ok: boolean;
  competition: Competition | null;
  errorMessage: string | null;
}

export interface AdminCompetitionDeleteState {
  ok: boolean;
  deletedId: string | null;
  errorMessage: string | null;
}

function getTextValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function loginAdminAction(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const email = getTextValue(formData.get("email"));
  const password = getTextValue(formData.get("password"));

  if (!email || !password) {
    return {
      errorMessage: "Email admin dan kata sandi wajib diisi.",
    };
  }

  if (!validateAdminCredentials(email, password)) {
    return {
      errorMessage: "Email admin atau kata sandi belum sesuai.",
    };
  }

  await createAdminSession();
  redirect("/admin/panel");
}

export async function logoutAdminAction(): Promise<void> {
  await clearAdminSession();
  redirect("/admin");
}

function getUnknownErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Terjadi kendala saat memproses perubahan data kompetisi.";
}

function getValidationErrorMessage(input: unknown): string | null {
  const parsedInput = competitionSchema.safeParse(input);

  if (parsedInput.success) {
    return null;
  }

  const firstIssue = parsedInput.error.issues[0];

  return firstIssue?.message ?? "Data kompetisi belum valid.";
}

export async function createCompetitionAction(
  input: unknown,
): Promise<AdminCompetitionMutationState> {
  await requireAdminSession();

  const validationMessage = getValidationErrorMessage(input);

  if (validationMessage) {
    return {
      ok: false,
      competition: null,
      errorMessage: validationMessage,
    };
  }

  const parsedInput = competitionSchema.parse(input);

  try {
    const createdCompetition = await createCompetitionInBackend(parsedInput);

    return {
      ok: true,
      competition: createdCompetition,
      errorMessage: null,
    };
  } catch (error) {
    return {
      ok: false,
      competition: null,
      errorMessage: getUnknownErrorMessage(error),
    };
  }
}

export async function updateCompetitionAction(
  competitionId: string,
  input: unknown,
): Promise<AdminCompetitionMutationState> {
  await requireAdminSession();

  const normalizedCompetitionId = competitionId.trim();

  if (!normalizedCompetitionId) {
    return {
      ok: false,
      competition: null,
      errorMessage: "ID kompetisi wajib diisi sebelum proses update.",
    };
  }

  const validationMessage = getValidationErrorMessage(input);

  if (validationMessage) {
    return {
      ok: false,
      competition: null,
      errorMessage: validationMessage,
    };
  }

  const parsedInput = competitionSchema.parse(input);

  if (parsedInput.id !== normalizedCompetitionId) {
    return {
      ok: false,
      competition: null,
      errorMessage: "ID pada payload tidak sama dengan ID yang sedang diperbarui.",
    };
  }

  try {
    const updatedCompetition = await updateCompetitionInBackend(normalizedCompetitionId, parsedInput);

    return {
      ok: true,
      competition: updatedCompetition,
      errorMessage: null,
    };
  } catch (error) {
    return {
      ok: false,
      competition: null,
      errorMessage: getUnknownErrorMessage(error),
    };
  }
}

export async function deleteCompetitionAction(
  competitionId: string,
): Promise<AdminCompetitionDeleteState> {
  await requireAdminSession();

  const normalizedCompetitionId = competitionId.trim();

  if (!normalizedCompetitionId) {
    return {
      ok: false,
      deletedId: null,
      errorMessage: "ID kompetisi wajib diisi sebelum proses hapus.",
    };
  }

  try {
    const deletedId = await deleteCompetitionFromBackend(normalizedCompetitionId);

    return {
      ok: true,
      deletedId,
      errorMessage: null,
    };
  } catch (error) {
    return {
      ok: false,
      deletedId: null,
      errorMessage: getUnknownErrorMessage(error),
    };
  }
}
