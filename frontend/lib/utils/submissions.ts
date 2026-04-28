import type {
  Competition,
  CompetitionSubmission,
  CompetitionSubmissionCreateInput,
} from "@/lib/types";

interface SubmissionCreateApiPayload {
  ok: boolean;
  data: CompetitionSubmission;
}

interface SubmissionListApiPayload {
  ok: boolean;
  data: CompetitionSubmission[];
  total: number;
}

interface SubmissionApproveApiPayload {
  ok: boolean;
  data: Competition;
}

interface SubmissionRejectApiPayload {
  ok: boolean;
  submissionId: string;
}

export interface SubmissionListResult {
  submissions: CompetitionSubmission[];
  source: "backend" | "unavailable";
  errorMessage: string | null;
}

const DEFAULT_BACKEND_BASE_URL = "http://localhost:4000";
const BACKEND_TIMEOUT_MS = 3000;
const BACKEND_ADMIN_TOKEN_HEADER = "x-compbase-admin-token";

function getBackendBaseUrl(): string {
  const configuredBaseUrl = process.env.BACKEND_BASE_URL?.trim();

  return configuredBaseUrl ? configuredBaseUrl : DEFAULT_BACKEND_BASE_URL;
}

function getBackendAdminToken(): string | null {
  const configuredToken = process.env.BACKEND_ADMIN_TOKEN?.trim();

  return configuredToken ? configuredToken : null;
}

function getMutationHeaders(includeJsonContentType: boolean): Record<string, string> {
  const headers: Record<string, string> = {};

  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  const backendAdminToken = getBackendAdminToken();

  if (backendAdminToken) {
    headers[BACKEND_ADMIN_TOKEN_HEADER] = backendAdminToken;
  }

  return headers;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function isCompetitionLinks(value: unknown): boolean {
  const links = toRecord(value);

  if (!links) {
    return false;
  }

  const allowedKeys = [
    "registration",
    "guidebook",
    "instagram",
    "linktree",
    "website",
  ];

  return allowedKeys.every(
    (key) => links[key] === undefined || typeof links[key] === "string",
  );
}

function isCompetitionSubmission(value: unknown): value is CompetitionSubmission {
  const submission = toRecord(value);

  if (!submission) {
    return false;
  }

  return (
    typeof submission.id === "string" &&
    typeof submission.name === "string" &&
    typeof submission.slug === "string" &&
    typeof submission.organizer === "string" &&
    typeof submission.category === "string" &&
    typeof submission.regStart === "string" &&
    typeof submission.regEnd === "string" &&
    typeof submission.eventStart === "string" &&
    typeof submission.eventEnd === "string" &&
    typeof submission.isPriority === "boolean" &&
    typeof submission.hasGuidebook === "boolean" &&
    isCompetitionLinks(submission.links) &&
    typeof submission.submitterName === "string" &&
    typeof submission.submitterEmail === "string" &&
    typeof submission.notes === "string" &&
    typeof submission.status === "string" &&
    typeof submission.paymentStatus === "string" &&
    typeof submission.reviewedBy === "string" &&
    typeof submission.reviewedAt === "string" &&
    typeof submission.createdAt === "string" &&
    typeof submission.updatedAt === "string"
  );
}

function isSubmissionListApiPayload(value: unknown): value is SubmissionListApiPayload {
  const payload = toRecord(value);

  if (!payload) {
    return false;
  }

  return (
    payload.ok === true &&
    typeof payload.total === "number" &&
    Array.isArray(payload.data) &&
    payload.data.every((submission) => isCompetitionSubmission(submission))
  );
}

function isSubmissionCreateApiPayload(
  value: unknown,
): value is SubmissionCreateApiPayload {
  const payload = toRecord(value);

  if (!payload) {
    return false;
  }

  return payload.ok === true && isCompetitionSubmission(payload.data);
}

function isSubmissionApproveApiPayload(
  value: unknown,
): value is SubmissionApproveApiPayload {
  const payload = toRecord(value);

  if (!payload) {
    return false;
  }

  const competition = toRecord(payload.data);

  return (
    payload.ok === true &&
    !!competition &&
    typeof competition.id === "string" &&
    typeof competition.name === "string"
  );
}

function isSubmissionRejectApiPayload(
  value: unknown,
): value is SubmissionRejectApiPayload {
  const payload = toRecord(value);

  if (!payload) {
    return false;
  }

  return payload.ok === true && typeof payload.submissionId === "string";
}

function getBackendErrorMessage(payload: unknown): string | null {
  const responsePayload = toRecord(payload);

  if (!responsePayload) {
    return null;
  }

  if (
    typeof responsePayload.error === "string" &&
    responsePayload.error.trim()
  ) {
    return responsePayload.error;
  }

  return null;
}

async function parseResponsePayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function createCompetitionSubmissionInBackend(
  input: CompetitionSubmissionCreateInput,
): Promise<CompetitionSubmission> {
  const baseUrl = getBackendBaseUrl();

  const response = await fetch(`${baseUrl}/submissions`, {
    method: "POST",
    cache: "no-store",
    headers: getMutationHeaders(true),
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
  });

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new Error(
      getBackendErrorMessage(payload) ?? "Backend gagal menyimpan pengajuan kompetisi.",
    );
  }

  if (!isSubmissionCreateApiPayload(payload)) {
    throw new Error("Format respons backend untuk pengajuan kompetisi belum sesuai.");
  }

  return payload.data;
}

export async function getSubmissionsFromBackend(): Promise<SubmissionListResult> {
  const baseUrl = getBackendBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/submissions`, {
      method: "GET",
      cache: "no-store",
      headers: getMutationHeaders(false),
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        submissions: [],
        source: "unavailable",
        errorMessage: "Data pengajuan belum bisa dimuat saat ini.",
      };
    }

    const payload = await parseResponsePayload(response);

    if (!isSubmissionListApiPayload(payload)) {
      return {
        submissions: [],
        source: "unavailable",
        errorMessage: "Format respons backend untuk data pengajuan belum sesuai.",
      };
    }

    return {
      submissions: payload.data,
      source: "backend",
      errorMessage: null,
    };
  } catch {
    return {
      submissions: [],
      source: "unavailable",
      errorMessage: "Backend pengajuan sedang tidak tersedia.",
    };
  }
}

export async function approveSubmissionInBackend(
  submissionId: string,
): Promise<Competition> {
  const baseUrl = getBackendBaseUrl();

  const response = await fetch(
    `${baseUrl}/submissions/${encodeURIComponent(submissionId)}/approve`,
    {
      method: "POST",
      cache: "no-store",
      headers: getMutationHeaders(false),
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    },
  );

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new Error(
      getBackendErrorMessage(payload) ?? "Backend gagal menyetujui pengajuan.",
    );
  }

  if (!isSubmissionApproveApiPayload(payload)) {
    throw new Error("Format respons backend untuk persetujuan belum sesuai.");
  }

  return payload.data;
}

export async function rejectSubmissionInBackend(
  submissionId: string,
): Promise<string> {
  const baseUrl = getBackendBaseUrl();

  const response = await fetch(
    `${baseUrl}/submissions/${encodeURIComponent(submissionId)}/reject`,
    {
      method: "POST",
      cache: "no-store",
      headers: getMutationHeaders(false),
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    },
  );

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new Error(
      getBackendErrorMessage(payload) ?? "Backend gagal menolak pengajuan.",
    );
  }

  if (!isSubmissionRejectApiPayload(payload)) {
    throw new Error("Format respons backend untuk penolakan belum sesuai.");
  }

  return payload.submissionId;
}
