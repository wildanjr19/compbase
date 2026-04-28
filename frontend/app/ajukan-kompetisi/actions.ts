"use server";

import { publicSubmissionSchema } from "@/app/ajukan-kompetisi/schema";
import { createCompetitionSubmissionInBackend } from "@/lib/utils/submissions";

export interface SubmissionFormState {
  ok: boolean;
  successMessage: string | null;
  errorMessage: string | null;
}

function getTextValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function getUnknownErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Pengajuan belum berhasil dikirim. Silakan coba lagi.";
}

export async function submitCompetitionProposalAction(
  _previousState: SubmissionFormState,
  formData: FormData,
): Promise<SubmissionFormState> {
  const eventDateMode = getTextValue(formData.get("eventDateMode"));
  const rawEventStart = getTextValue(formData.get("eventStart"));
  const rawEventEnd = getTextValue(formData.get("eventEnd"));
  const eventEndValue =
    eventDateMode === "single" ? rawEventStart : rawEventEnd;

  const input = {
    name: getTextValue(formData.get("name")),
    organizer: getTextValue(formData.get("organizer")),
    category: getTextValue(formData.get("category")),
    regStart: getTextValue(formData.get("regStart")),
    regEnd: getTextValue(formData.get("regEnd")),
    eventStart: rawEventStart,
    eventEnd: eventEndValue,
    links: {
      registration: getTextValue(formData.get("registration")),
      guidebook: getTextValue(formData.get("guidebook")),
      instagram: getTextValue(formData.get("instagram")),
      linktree: getTextValue(formData.get("linktree")),
      website: getTextValue(formData.get("website")),
    },
    submitterName: getTextValue(formData.get("submitterName")),
    submitterEmail: getTextValue(formData.get("submitterEmail")),
    notes: getTextValue(formData.get("notes")),
    honeypot: getTextValue(formData.get("websiteToken")),
  };

  const parsedResult = publicSubmissionSchema.safeParse(input);

  if (!parsedResult.success) {
    const firstIssue = parsedResult.error.issues[0];

    return {
      ok: false,
      successMessage: null,
      errorMessage: firstIssue?.message ?? "Data pengajuan belum valid.",
    };
  }

  try {
    await createCompetitionSubmissionInBackend(parsedResult.data);
    return {
      ok: true,
      successMessage:
        "Pengajuan berhasil dikirim. Tim admin akan meninjau data Anda sebelum dipublikasikan.",
      errorMessage: null,
    };
  } catch (error) {
    return {
      ok: false,
      successMessage: null,
      errorMessage: getUnknownErrorMessage(error),
    };
  }
}
