import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { z } from "zod";

const COMPETITION_CATEGORIES = [
  "Dashboard",
  "Data Mining",
  "Data Science",
  "Datathon",
  "Essay",
  "Hackathon",
  "Infografis",
  "LKTI",
] as const;

type CompetitionCategory = (typeof COMPETITION_CATEGORIES)[number];

interface CompetitionLinks {
  registration?: string;
  guidebook?: string;
  instagram?: string;
  linktree?: string;
  website?: string;
}

interface Competition {
  id: string;
  name: string;
  slug: string;
  organizer: string;
  category: CompetitionCategory;
  regStart: string;
  regEnd: string;
  eventStart: string;
  eventEnd: string;
  isPriority: boolean;
  hasGuidebook: boolean;

  links: CompetitionLinks;
}

interface CompetitionsResponse {
  ok: true;
  data: Competition[];
  total: number;
}

interface CompetitionResponse {
  ok: true;
  data: Competition;
}

interface DeleteCompetitionResponse {
  ok: true;
  deletedId: string;
}

interface HealthResponse {
  ok: true;
  service: string;
  timestamp: string;
}

interface ErrorResponse {
  ok: false;
  error: string;
  details?: string[];
}

const optionalUrlSchema = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .url("Tautan harus menggunakan URL valid dengan protokol http atau https."),
]);

const competitionLinksSchema = z.object({
  registration: optionalUrlSchema.optional().default(""),
  guidebook: optionalUrlSchema.optional().default(""),
  instagram: optionalUrlSchema.optional().default(""),
  linktree: optionalUrlSchema.optional().default(""),
  website: optionalUrlSchema.optional().default(""),
});

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

const competitionSchema = z
  .object({
    id: z.string().trim().min(1, "ID kompetisi wajib diisi."),
    name: z.string().trim().min(1, "Nama kompetisi wajib diisi."),
    slug: z.string().trim().min(1, "Slug kompetisi wajib diisi."),
    organizer: z.string().trim().min(1, "Nama penyelenggara wajib diisi."),
    category: z.enum(COMPETITION_CATEGORIES),
    regStart: z
      .string()
      .trim()
      .refine(isDateString, "Format tanggal buka registrasi harus YYYY-MM-DD."),
    regEnd: z
      .string()
      .trim()
      .refine(
        isDateString,
        "Format tanggal tutup registrasi harus YYYY-MM-DD.",
      ),
    eventStart: z
      .string()
      .trim()
      .refine(
        isDateString,
        "Format tanggal mulai pelaksanaan harus YYYY-MM-DD.",
      ),
    eventEnd: z
      .string()
      .trim()
      .refine(
        isDateString,
        "Format tanggal selesai pelaksanaan harus YYYY-MM-DD.",
      ),
    isPriority: z.boolean(),
    hasGuidebook: z.boolean(),

    links: competitionLinksSchema,
  })
  .superRefine((competition, context) => {
    if (competition.regStart > competition.regEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Tanggal buka registrasi tidak boleh melewati tanggal tutup registrasi.",
        path: ["regStart"],
      });
    }

    if (competition.eventStart > competition.eventEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Tanggal mulai pelaksanaan tidak boleh melewati tanggal selesai pelaksanaan.",
        path: ["eventStart"],
      });
    }

    if (competition.regEnd > competition.eventEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Deadline pendaftaran tidak boleh melewati akhir pelaksanaan.",
        path: ["regEnd"],
      });
    }
  });

const COMPETITIONS: Competition[] = [];

const port = process.env.BACKEND_PORT || 4000;
const ADMIN_TOKEN_HEADER = "x-compbase-admin-token";

function getBackendAdminToken(): string | null {
  const configuredToken = process.env.BACKEND_ADMIN_TOKEN?.trim();

  return configuredToken ? configuredToken : null;
}

function isWriteMethod(method: string | undefined): boolean {
  return method === "POST" || method === "PUT" || method === "DELETE";
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

  if (!providedToken) {
    return false;
  }

  return providedToken === configuredToken;
}

function sendJson(
  res: ServerResponse,
  statusCode: number,
  payload:
    | CompetitionsResponse
    | CompetitionResponse
    | DeleteCompetitionResponse
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

function normalizeCompetition(
  input: z.infer<typeof competitionSchema>,
): Competition {
  const links: CompetitionLinks = {
    registration: input.links.registration.trim(),
    guidebook: input.links.guidebook.trim(),
    instagram: input.links.instagram.trim(),
    linktree: input.links.linktree.trim(),
    website: input.links.website.trim(),
  };

  return {
    ...input,
    id: input.id.trim(),
    name: input.name.trim(),
    slug: input.slug.trim(),
    organizer: input.organizer.trim(),

    links,
    hasGuidebook: Boolean(links.guidebook),
  };
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

function getValidationMessages(error: z.ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}

function findCompetitionIndex(competitionId: string): number {
  return COMPETITIONS.findIndex(
    (competition) => competition.id === competitionId,
  );
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

    const normalizedCompetition = normalizeCompetition(parsedPayload.data);
    const existingCompetitionIndex = findCompetitionIndex(
      normalizedCompetition.id,
    );

    if (existingCompetitionIndex !== -1) {
      sendJson(res, 409, {
        ok: false,
        error: `Kompetisi dengan ID ${normalizedCompetition.id} sudah ada.`,
      });
      return;
    }

    COMPETITIONS.unshift(normalizedCompetition);
    sendJson(res, 201, { ok: true, data: normalizedCompetition });
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
  const existingCompetitionIndex = findCompetitionIndex(competitionId);

  if (existingCompetitionIndex === -1) {
    sendJson(res, 404, {
      ok: false,
      error: `Kompetisi dengan ID ${competitionId} tidak ditemukan.`,
    });
    return;
  }

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

    COMPETITIONS[existingCompetitionIndex] = normalizedCompetition;
    sendJson(res, 200, { ok: true, data: normalizedCompetition });
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

function handleDeleteCompetition(
  res: ServerResponse,
  competitionId: string,
): void {
  const existingCompetitionIndex = findCompetitionIndex(competitionId);

  if (existingCompetitionIndex === -1) {
    sendJson(res, 404, {
      ok: false,
      error: `Kompetisi dengan ID ${competitionId} tidak ditemukan.`,
    });
    return;
  }

  COMPETITIONS.splice(existingCompetitionIndex, 1);
  sendJson(res, 200, {
    ok: true,
    deletedId: competitionId,
  });
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

  if (isWriteMethod(req.method) && !isAuthorizedForWrite(req)) {
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
    });
    return;
  }

  if (pathname === "/competitions" && req.method === "GET") {
    sendJson(res, 200, {
      ok: true,
      data: COMPETITIONS,
      total: COMPETITIONS.length,
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
    handleDeleteCompetition(res, competitionId);
    return;
  }

  sendJson(res, 404, {
    ok: false,
    error: "Not Found",
  });
}

const server = createServer((req, res) => {
  void handleRequest(req, res).catch((error: unknown) => {
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
  console.log(`Backend berjalan di http://localhost:${port}`);
});
