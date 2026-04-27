import type { Competition } from "@/lib/types";

export interface BackendHealth {
  ok: boolean;
  service: string;
  timestamp: string;
}

export interface CompetitionApiResult {
  competitions: Competition[];
  source: "backend" | "fallback";
  errorMessage: string | null;
}

interface CompetitionsApiPayload {
  ok: boolean;
  data: Competition[];
  total: number;
}

interface CompetitionMutationApiPayload {
  ok: boolean;
  data: Competition;
}

interface CompetitionDeleteApiPayload {
  ok: boolean;
  deletedId: string;
}

const DEFAULT_BACKEND_BASE_URL = "http://localhost:4000";
const HEALTH_CHECK_TIMEOUT_MS = 1500;
const COMPETITIONS_FETCH_TIMEOUT_MS = 3000;
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

  // Type assertion ini dipakai setelah pengecekan runtime karena kita perlu mengakses properti dinamis.
  return value as Record<string, unknown>;
}

function isBackendHealth(value: unknown): value is BackendHealth {
  const payload = toRecord(value);

  if (!payload) {
    return false;
  }

  return (
    payload.ok === true &&
    typeof payload.service === "string" &&
    typeof payload.timestamp === "string"
  );
}

function isCompetitionLinks(value: unknown): value is Competition["links"] {
  const links = toRecord(value);

  if (!links) {
    return false;
  }
  const allowedKeys = ["registration", "guidebook", "instagram", "linktree", "website"];

  return allowedKeys.every((key) => links[key] === undefined || typeof links[key] === "string");
}

function isCompetition(value: unknown): value is Competition {
  const competition = toRecord(value);

  if (!competition) {
    return false;
  }

  return (
    typeof competition.id === "string" &&
    typeof competition.name === "string" &&
    typeof competition.slug === "string" &&
    typeof competition.organizer === "string" &&
    typeof competition.category === "string" &&
    typeof competition.regStart === "string" &&
    typeof competition.regEnd === "string" &&
    typeof competition.eventStart === "string" &&
    typeof competition.eventEnd === "string" &&
    typeof competition.isPriority === "boolean" &&
    typeof competition.hasGuidebook === "boolean" &&
    typeof competition.description === "string" &&
    isCompetitionLinks(competition.links)
  );
}

function isCompetitionsApiPayload(value: unknown): value is CompetitionsApiPayload {
  const payload = toRecord(value);

  if (!payload) {
    return false;
  }

  return (
    payload.ok === true &&
    typeof payload.total === "number" &&
    Array.isArray(payload.data) &&
    payload.data.every((competition) => isCompetition(competition))
  );
}

function isCompetitionMutationApiPayload(value: unknown): value is CompetitionMutationApiPayload {
  const payload = toRecord(value);

  if (!payload) {
    return false;
  }

  return payload.ok === true && isCompetition(payload.data);
}

function isCompetitionDeleteApiPayload(value: unknown): value is CompetitionDeleteApiPayload {
  const payload = toRecord(value);

  if (!payload) {
    return false;
  }

  return payload.ok === true && typeof payload.deletedId === "string";
}

function getBackendErrorMessage(payload: unknown): string | null {
  const responsePayload = toRecord(payload);

  if (!responsePayload) {
    return null;
  }

  if (typeof responsePayload.error === "string" && responsePayload.error.trim()) {
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

export async function getBackendHealth(baseUrl: string): Promise<BackendHealth | null> {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();

    if (!isBackendHealth(payload)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getCompetitionsFromBackend(
  fallbackCompetitions: Competition[],
): Promise<CompetitionApiResult> {
  const baseUrl = getBackendBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/competitions`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(COMPETITIONS_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        competitions: fallbackCompetitions,
        source: "fallback",
        errorMessage: "Katalog sementara memakai data lokal karena backend belum merespons normal.",
      };
    }

    const payload: unknown = await response.json();

    if (!isCompetitionsApiPayload(payload)) {
      return {
        competitions: fallbackCompetitions,
        source: "fallback",
        errorMessage: "Katalog sementara memakai data lokal karena format respons backend belum sesuai.",
      };
    }

    return {
      competitions: payload.data,
      source: "backend",
      errorMessage: null,
    };
  } catch {
    return {
      competitions: fallbackCompetitions,
      source: "fallback",
      errorMessage: "Katalog sementara memakai data lokal karena backend belum terhubung.",
    };
  }
}

export async function createCompetitionInBackend(competition: Competition): Promise<Competition> {
  const baseUrl = getBackendBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/competitions`, {
      method: "POST",
      cache: "no-store",
      headers: getMutationHeaders(true),
      body: JSON.stringify(competition),
      signal: AbortSignal.timeout(COMPETITIONS_FETCH_TIMEOUT_MS),
    });
    const payload = await parseResponsePayload(response);

    if (!response.ok) {
      throw new Error(
        getBackendErrorMessage(payload) ?? "Backend gagal membuat data kompetisi baru.",
      );
    }

    if (!isCompetitionMutationApiPayload(payload)) {
      throw new Error("Format respons backend untuk membuat kompetisi belum sesuai.");
    }

    return payload.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Terjadi kendala saat mengirim data kompetisi ke backend.");
  }
}

export async function updateCompetitionInBackend(
  competitionId: string,
  competition: Competition,
): Promise<Competition> {
  const baseUrl = getBackendBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/competitions/${encodeURIComponent(competitionId)}`, {
      method: "PUT",
      cache: "no-store",
      headers: getMutationHeaders(true),
      body: JSON.stringify(competition),
      signal: AbortSignal.timeout(COMPETITIONS_FETCH_TIMEOUT_MS),
    });
    const payload = await parseResponsePayload(response);

    if (!response.ok) {
      throw new Error(
        getBackendErrorMessage(payload) ?? "Backend gagal memperbarui data kompetisi.",
      );
    }

    if (!isCompetitionMutationApiPayload(payload)) {
      throw new Error("Format respons backend untuk pembaruan kompetisi belum sesuai.");
    }

    return payload.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Terjadi kendala saat memperbarui data kompetisi ke backend.");
  }
}

export async function deleteCompetitionFromBackend(competitionId: string): Promise<string> {
  const baseUrl = getBackendBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/competitions/${encodeURIComponent(competitionId)}`, {
      method: "DELETE",
      cache: "no-store",
      headers: getMutationHeaders(false),
      signal: AbortSignal.timeout(COMPETITIONS_FETCH_TIMEOUT_MS),
    });
    const payload = await parseResponsePayload(response);

    if (!response.ok) {
      throw new Error(getBackendErrorMessage(payload) ?? "Backend gagal menghapus data kompetisi.");
    }

    if (!isCompetitionDeleteApiPayload(payload)) {
      throw new Error("Format respons backend untuk penghapusan kompetisi belum sesuai.");
    }

    return payload.deletedId;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Terjadi kendala saat menghapus data kompetisi di backend.");
  }
}
