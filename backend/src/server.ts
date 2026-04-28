import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { ZodError } from "zod";
import {
  competitionSchema,
  getValidationMessages,
  normalizeCompetition,
  type Competition,
} from "./competition.ts";
import { createCompetitionStore } from "./dataStore.ts";
import {
  competitionSubmissionSchema,
  normalizeSubmissionInput,
  type CompetitionSubmission,
} from "./submission.ts";

interface CompetitionsResponse {
  ok: true;
  data: Competition[];
  total: number;
  source: "supabase" | "local";
}

interface CompetitionResponse {
  ok: true;
  data: Competition;
  source: "supabase" | "local";
}

interface DeleteCompetitionResponse {
  ok: true;
  deletedId: string;
  source: "supabase" | "local";
}

interface SubmissionsResponse {
  ok: true;
  data: CompetitionSubmission[];
  total: number;
  source: "supabase" | "local";
}

interface SubmissionResponse {
  ok: true;
  data: CompetitionSubmission;
  source: "supabase" | "local";
}

interface SubmissionActionResponse {
  ok: true;
  submissionId: string;
  source: "supabase" | "local";
}

interface HealthResponse {
  ok: true;
  service: string;
  timestamp: string;
  dataSource: "supabase" | "local";
}

interface ErrorResponse {
  ok: false;
  error: string;
  details?: string[];
}

const port = process.env.BACKEND_PORT || 4000;
const ADMIN_TOKEN_HEADER = "x-compbase-admin-token";
const competitionStore = createCompetitionStore();

function getBackendAdminToken(): string | null {
  const configuredToken = process.env.BACKEND_ADMIN_TOKEN?.trim();
  return configuredToken ? configuredToken : null;
}

function isWriteMethod(method: string | undefined): boolean {
  return method === "POST" || method === "PUT" || method === "DELETE";
}

function isPublicSubmissionCreate(pathname: string, method: string | undefined): boolean {
  return pathname === "/submissions" && method === "POST";
}

function getHeaderValue(
  headers: IncomingMessage["headers"],
  headerName: string,
): string | null {
  const headerValue = headers[headerName];

  if (typeof headerValue === "string") {
    return headerValue;
  }

  if (Array.isArray(headerValue)) {
    return headerValue[0] ?? null;
  }

  return null;
}

function isAuthorizedForWrite(req: IncomingMessage): boolean {
  const configuredToken = getBackendAdminToken();

  if (!configuredToken) {
    return true;
  }

  const providedToken = getHeaderValue(req.headers, ADMIN_TOKEN_HEADER);
  return providedToken === configuredToken;
}

function sendJson(
  res: ServerResponse,
  statusCode: number,
  payload:
    | CompetitionsResponse
    | CompetitionResponse
    | DeleteCompetitionResponse
    | SubmissionsResponse
    | SubmissionResponse
    | SubmissionActionResponse
    | HealthResponse
    | ErrorResponse,
): void {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function setCorsHeaders(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,x-compbase-admin-token",
  );
}

async function readRequestBody(req: IncomingMessage): Promise<unknown> {
  return await new Promise<unknown>((resolve, reject) => {
    let body = "";

    req.setEncoding("utf8");
    req.on("data", (chunk: string) => {
      body += chunk;

      if (body.length > 1_000_000) {
        reject(new Error("Ukuran payload melebihi batas maksimum."));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body.trim()) {
        reject(new Error("Body request wajib diisi JSON."));
        return;
      }

      try {
        const payload: unknown = JSON.parse(body);
        resolve(payload);
      } catch {
        reject(new Error("Format JSON tidak valid."));
      }
    });

    req.on("error", () => {
      reject(new Error("Terjadi masalah saat membaca body request."));
    });
  });
}

function getCompetitionIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/competitions\/([^/]+)$/);

  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function getSubmissionActionPath(
  pathname: string,
): { submissionId: string; action: "approve" | "reject" } | null {
  const match = pathname.match(/^\/submissions\/([^/]+)\/(approve|reject)$/);

  if (!match) {
    return null;
  }

  try {
    return {
      submissionId: decodeURIComponent(match[1]),
      action: match[2] as "approve" | "reject",
    };
  } catch {
    return {
      submissionId: match[1],
      action: match[2] as "approve" | "reject",
    };
  }
}

async function handleCreateCompetition(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const rawPayload = await readRequestBody(req);
    const parsedPayload = competitionSchema.safeParse(rawPayload);

    if (!parsedPayload.success) {
      sendJson(res, 422, {
        ok: false,
        error: "Validasi data kompetisi gagal.",
        details: getValidationMessages(parsedPayload.error),
      });
      return;
    }

    const createdCompetition = await competitionStore.createCompetition(
      normalizeCompetition(parsedPayload.data),
    );

    sendJson(res, 201, {
      ok: true,
      data: createdCompetition,
      source: competitionStore.source,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal memproses data kompetisi.";

    sendJson(res, 400, {
      ok: false,
      error: message,
    });
  }
}

async function handleUpdateCompetition(
  req: IncomingMessage,
  res: ServerResponse,
  competitionId: string,
): Promise<void> {
  try {
    const rawPayload = await readRequestBody(req);
    const parsedPayload = competitionSchema.safeParse(rawPayload);

    if (!parsedPayload.success) {
      sendJson(res, 422, {
        ok: false,
        error: "Validasi data kompetisi gagal.",
        details: getValidationMessages(parsedPayload.error),
      });
      return;
    }

    const normalizedCompetition = normalizeCompetition(parsedPayload.data);

    if (normalizedCompetition.id !== competitionId) {
      sendJson(res, 400, {
        ok: false,
        error: "ID pada path harus sama dengan ID pada payload.",
      });
      return;
    }

    const updatedCompetition = await competitionStore.updateCompetition(
      competitionId,
      normalizedCompetition,
    );

    sendJson(res, 200, {
      ok: true,
      data: updatedCompetition,
      source: competitionStore.source,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal memperbarui data kompetisi.";

    sendJson(res, 400, {
      ok: false,
      error: message,
    });
  }
}

async function handleDeleteCompetition(
  res: ServerResponse,
  competitionId: string,
): Promise<void> {
  try {
    const deletedId = await competitionStore.deleteCompetition(competitionId);

    sendJson(res, 200, {
      ok: true,
      deletedId,
      source: competitionStore.source,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal menghapus data kompetisi.";

    sendJson(res, 404, {
      ok: false,
      error: message,
    });
  }
}

async function handleCreateSubmission(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const rawPayload = await readRequestBody(req);
    const parsedPayload = competitionSubmissionSchema.safeParse(rawPayload);

    if (!parsedPayload.success) {
      sendJson(res, 422, {
        ok: false,
        error: "Validasi data pengajuan kompetisi gagal.",
        details: getValidationMessages(parsedPayload.error),
      });
      return;
    }

    if (parsedPayload.data.honeypot) {
      sendJson(res, 400, {
        ok: false,
        error: "Pengajuan terdeteksi tidak valid.",
      });
      return;
    }

    const normalizedSubmission = normalizeSubmissionInput(parsedPayload.data);
    const createdSubmission = await competitionStore.createSubmission(
      normalizedSubmission,
    );

    sendJson(res, 201, {
      ok: true,
      data: createdSubmission,
      source: competitionStore.source,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal memproses pengajuan kompetisi.";

    sendJson(res, 400, {
      ok: false,
      error: message,
    });
  }
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url ?? "/", "http://localhost");
  const pathname = requestUrl.pathname;

  if (
    isWriteMethod(req.method) &&
    !isPublicSubmissionCreate(pathname, req.method) &&
    !isAuthorizedForWrite(req)
  ) {
    sendJson(res, 401, {
      ok: false,
      error: "Akses ditolak. Token admin backend tidak valid.",
    });
    return;
  }

  if (pathname === "/health" && req.method === "GET") {
    sendJson(res, 200, {
      ok: true,
      service: "backend",
      timestamp: new Date().toISOString(),
      dataSource: competitionStore.source,
    });
    return;
  }

  if (pathname === "/competitions" && req.method === "GET") {
    const competitions = await competitionStore.listCompetitions();
    sendJson(res, 200, {
      ok: true,
      data: competitions,
      total: competitions.length,
      source: competitionStore.source,
    });
    return;
  }

  if (pathname === "/competitions" && req.method === "POST") {
    await handleCreateCompetition(req, res);
    return;
  }

  const competitionId = getCompetitionIdFromPath(pathname);

  if (competitionId && req.method === "PUT") {
    await handleUpdateCompetition(req, res, competitionId);
    return;
  }

  if (competitionId && req.method === "DELETE") {
    await handleDeleteCompetition(res, competitionId);
    return;
  }

  if (pathname === "/submissions" && req.method === "POST") {
    await handleCreateSubmission(req, res);
    return;
  }

  if (pathname === "/submissions" && req.method === "GET") {
    if (!isAuthorizedForWrite(req)) {
      sendJson(res, 401, {
        ok: false,
        error: "Akses ditolak. Token admin backend tidak valid.",
      });
      return;
    }

    const submissions = await competitionStore.listSubmissions();

    sendJson(res, 200, {
      ok: true,
      data: submissions,
      total: submissions.length,
      source: competitionStore.source,
    });
    return;
  }

  const submissionAction = getSubmissionActionPath(pathname);

  if (submissionAction && req.method === "POST") {
    if (submissionAction.action === "approve") {
      const createdCompetition = await competitionStore.approveSubmission(
        submissionAction.submissionId,
      );

      sendJson(res, 200, {
        ok: true,
        data: createdCompetition,
        source: competitionStore.source,
      });
      return;
    }

    const rejectedId = await competitionStore.rejectSubmission(
      submissionAction.submissionId,
    );

    sendJson(res, 200, {
      ok: true,
      submissionId: rejectedId,
      source: competitionStore.source,
    });
    return;
  }

  sendJson(res, 404, {
    ok: false,
    error: "Not Found",
  });
}

const server = createServer((req, res) => {
  void handleRequest(req, res).catch((error: unknown) => {
    if (error instanceof ZodError) {
      sendJson(res, 422, {
        ok: false,
        error: "Validasi data gagal.",
        details: getValidationMessages(error),
      });
      return;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan internal backend.";

    sendJson(res, 500, {
      ok: false,
      error: message,
    });
  });
});

server.listen(port, () => {
  console.log(
    `Backend berjalan di http://localhost:${port} dengan sumber data ${competitionStore.source}.`,
  );
});
