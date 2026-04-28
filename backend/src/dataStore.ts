import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  competitionSchema,
  createSlug,
  getNextCompetitionId,
  normalizeCompetition,
  type Competition,
} from "./competition.ts";
import {
  submissionToCompetition,
  toCompetitionSubmission,
  type CompetitionSubmission,
} from "./submission.ts";

export interface CompetitionStore {
  listCompetitions(): Promise<Competition[]>;
  createCompetition(competition: Competition): Promise<Competition>;
  updateCompetition(
    competitionId: string,
    competition: Competition,
  ): Promise<Competition>;
  deleteCompetition(competitionId: string): Promise<string>;
  listSubmissions(): Promise<CompetitionSubmission[]>;
  createSubmission(submission: CompetitionSubmission): Promise<CompetitionSubmission>;
  approveSubmission(submissionId: string): Promise<Competition>;
  rejectSubmission(submissionId: string): Promise<string>;
  deleteSubmission(submissionId: string): Promise<string>;
  source: "supabase" | "local";
}

interface SupabaseCompetitionRow {
  id: string;
  name: string;
  slug: string;
  organizer: string;
  category: Competition["category"];
  regStart: string | null;
  regEnd: string | null;
  eventStart: string | null;
  eventEnd: string | null;
  isPriority: boolean;
  hasGuidebook: boolean;
  links: Competition["links"];
}

interface SupabaseSubmissionRow {
  id: string;
  name: string;
  slug: string;
  organizer: string;
  category: CompetitionSubmission["category"];
  reg_start: string | null;
  reg_end: string | null;
  event_start: string | null;
  event_end: string | null;
  is_priority: boolean;
  has_guidebook: boolean;
  links: CompetitionSubmission["links"];
  submitter_name: string;
  submitter_email: string;
  notes: string | null;
  status: CompetitionSubmission["status"];
  payment_status: CompetitionSubmission["paymentStatus"];
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

const backendRootPath = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRootPath = resolve(backendRootPath, "..");
const defaultLocalDataPath = resolve(
  backendRootPath,
  ".local",
  "competitions.json",
);
const defaultLocalSubmissionsPath = resolve(
  backendRootPath,
  ".local",
  "submissions.json",
);
const competitionArraySchema = z.array(competitionSchema);
const submissionArraySchema = z.array(z.record(z.string(), z.unknown()));
const MAX_PRIORITY_COMPETITIONS = 3;

function getSupabaseUrl(): string | null {
  const value = process.env.SUPABASE_URL?.trim();
  return value ? value : null;
}

function getSupabaseServiceRoleKey(): string | null {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return value ? value : null;
}

function getSupabaseTableName(): string {
  const value = process.env.SUPABASE_COMPETITIONS_TABLE?.trim();
  return value ? value : "competitions";
}

function getSupabaseSubmissionTableName(): string {
  const value = process.env.SUPABASE_SUBMISSIONS_TABLE?.trim();
  return value ? value : "competition_submissions";
}

function getLocalCompetitionsFilePath(): string {
  const configuredPath = process.env.LOCAL_COMPETITIONS_FILE_PATH?.trim();

  if (!configuredPath) {
    return defaultLocalDataPath;
  }

  if (configuredPath.startsWith("backend/") || configuredPath.startsWith("backend\\")) {
    return resolve(workspaceRootPath, configuredPath);
  }

  return resolve(process.cwd(), configuredPath);
}

function getLocalSubmissionsFilePath(): string {
  const configuredPath = process.env.LOCAL_SUBMISSIONS_FILE_PATH?.trim();

  if (!configuredPath) {
    return defaultLocalSubmissionsPath;
  }

  if (configuredPath.startsWith("backend/") || configuredPath.startsWith("backend\\")) {
    return resolve(workspaceRootPath, configuredPath);
  }

  return resolve(process.cwd(), configuredPath);
}

function createSupabaseCompetitionClient(): SupabaseClient | null {
  const supabaseUrl = getSupabaseUrl();
  const supabaseServiceRoleKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function toSupabaseDateValue(value: string): string | null {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

function fromSupabaseDateValue(value: string | null): string {
  return value ?? "";
}

function toSupabaseCompetitionRow(competition: Competition): SupabaseCompetitionRow {
  return {
    ...competition,
    regStart: toSupabaseDateValue(competition.regStart),
    regEnd: toSupabaseDateValue(competition.regEnd),
    eventStart: toSupabaseDateValue(competition.eventStart),
    eventEnd: toSupabaseDateValue(competition.eventEnd),
    links: {
      registration: competition.links.registration ?? "",
      guidebook: competition.links.guidebook ?? "",
      instagram: competition.links.instagram ?? "",
      linktree: competition.links.linktree ?? "",
      website: competition.links.website ?? "",
    },
  };
}

function fromSupabaseCompetitionRow(row: SupabaseCompetitionRow): Competition {
  return normalizeCompetition(
    competitionSchema.parse({
      ...row,
      regStart: fromSupabaseDateValue(row.regStart),
      regEnd: fromSupabaseDateValue(row.regEnd),
      eventStart: fromSupabaseDateValue(row.eventStart),
      eventEnd: fromSupabaseDateValue(row.eventEnd),
      links: row.links ?? {},
    }),
  );
}

function toSupabaseSubmissionPayload(
  submission: CompetitionSubmission,
): Record<string, unknown> {
  return {
    id: submission.id,
    name: submission.name,
    slug: submission.slug,
    organizer: submission.organizer,
    category: submission.category,
    reg_start: toSupabaseDateValue(submission.regStart),
    reg_end: toSupabaseDateValue(submission.regEnd),
    event_start: toSupabaseDateValue(submission.eventStart),
    event_end: toSupabaseDateValue(submission.eventEnd),
    is_priority: submission.isPriority,
    has_guidebook: submission.hasGuidebook,
    links: {
      registration: submission.links.registration ?? "",
      guidebook: submission.links.guidebook ?? "",
      instagram: submission.links.instagram ?? "",
      linktree: submission.links.linktree ?? "",
      website: submission.links.website ?? "",
    },
    submitter_name: submission.submitterName,
    submitter_email: submission.submitterEmail,
    notes: submission.notes || null,
    status: submission.status,
    payment_status: submission.paymentStatus,
    reviewed_by: submission.reviewedBy || null,
    reviewed_at: submission.reviewedAt || null,
  };
}

function fromSupabaseSubmissionRow(
  row: SupabaseSubmissionRow,
): CompetitionSubmission {
  return toCompetitionSubmission(row as unknown as Record<string, unknown>);
}

async function readLocalCompetitions(): Promise<Competition[]> {
  const filePath = getLocalCompetitionsFilePath();

  try {
    const rawContent = await readFile(filePath, "utf8");
    const parsedContent: unknown = JSON.parse(rawContent);
    return competitionArraySchema.parse(parsedContent).map(normalizeCompetition);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeLocalCompetitions(competitions: Competition[]): Promise<void> {
  const filePath = getLocalCompetitionsFilePath();
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(competitions, null, 2), "utf8");
}

async function readLocalSubmissions(): Promise<CompetitionSubmission[]> {
  const filePath = getLocalSubmissionsFilePath();

  try {
    const rawContent = await readFile(filePath, "utf8");
    const parsedContent: unknown = JSON.parse(rawContent);
    const rows = submissionArraySchema.parse(parsedContent);

    return rows.map((row) => toCompetitionSubmission(row));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeLocalSubmissions(
  submissions: CompetitionSubmission[],
): Promise<void> {
  const filePath = getLocalSubmissionsFilePath();
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(submissions, null, 2), "utf8");
}

function canApproveSubmission(submission: CompetitionSubmission): boolean {
  return (
    submission.status === "pending" &&
    (submission.paymentStatus === "paid" || submission.paymentStatus === "waived")
  );
}

function ensurePriorityLimit(
  competitions: Competition[],
  candidate: Competition,
  currentCompetitionId?: string,
): void {
  if (!candidate.isPriority) {
    return;
  }

  const activePriorityCount = competitions.filter(
    (competition) =>
      competition.isPriority && competition.id !== currentCompetitionId,
  ).length;

  if (activePriorityCount >= MAX_PRIORITY_COMPETITIONS) {
    throw new Error(
      `Maksimal ${MAX_PRIORITY_COMPETITIONS} kompetisi dapat ditandai sebagai prioritas.`,
    );
  }
}

function createLocalCompetitionStore(): CompetitionStore {
  return {
    source: "local",
    async listCompetitions(): Promise<Competition[]> {
      return await readLocalCompetitions();
    },
    async createCompetition(competition: Competition): Promise<Competition> {
      const competitions = await readLocalCompetitions();
      const existingCompetition = competitions.some(
        (currentCompetition) => currentCompetition.id === competition.id,
      );

      if (existingCompetition) {
        throw new Error(`Kompetisi dengan ID ${competition.id} sudah ada.`);
      }

      ensurePriorityLimit(competitions, competition);

      const nextCompetitions = [competition, ...competitions];
      await writeLocalCompetitions(nextCompetitions);
      return competition;
    },
    async updateCompetition(
      competitionId: string,
      competition: Competition,
    ): Promise<Competition> {
      const competitions = await readLocalCompetitions();
      const competitionIndex = competitions.findIndex(
        (currentCompetition) => currentCompetition.id === competitionId,
      );

      if (competitionIndex === -1) {
        throw new Error(`Kompetisi dengan ID ${competitionId} tidak ditemukan.`);
      }

      ensurePriorityLimit(competitions, competition, competitionId);

      const nextCompetitions = [...competitions];
      nextCompetitions[competitionIndex] = competition;
      await writeLocalCompetitions(nextCompetitions);
      return competition;
    },
    async deleteCompetition(competitionId: string): Promise<string> {
      const competitions = await readLocalCompetitions();
      const nextCompetitions = competitions.filter(
        (competition) => competition.id !== competitionId,
      );

      if (nextCompetitions.length === competitions.length) {
        throw new Error(`Kompetisi dengan ID ${competitionId} tidak ditemukan.`);
      }

      await writeLocalCompetitions(nextCompetitions);
      return competitionId;
    },
    async listSubmissions(): Promise<CompetitionSubmission[]> {
      const submissions = await readLocalSubmissions();
      return [...submissions].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      );
    },
    async createSubmission(
      submission: CompetitionSubmission,
    ): Promise<CompetitionSubmission> {
      const submissions = await readLocalSubmissions();
      const nextSubmissions = [submission, ...submissions];
      await writeLocalSubmissions(nextSubmissions);
      return submission;
    },
    async approveSubmission(submissionId: string): Promise<Competition> {
      const submissions = await readLocalSubmissions();
      const submissionIndex = submissions.findIndex(
        (submission) => submission.id === submissionId,
      );

      if (submissionIndex === -1) {
        throw new Error(`Pengajuan dengan ID ${submissionId} tidak ditemukan.`);
      }

      const submission = submissions[submissionIndex];

      if (!canApproveSubmission(submission)) {
        throw new Error(
          `Pengajuan dengan ID ${submissionId} belum bisa disetujui karena status saat ini ${submission.status} atau pembayaran belum valid.`,
        );
      }

      const competitions = await readLocalCompetitions();
      const newCompetitionId = getNextCompetitionId(competitions);
      const competition = submissionToCompetition(
        {
          ...submission,
          slug: createSlug(submission.name),
        },
        newCompetitionId,
      );

      const createdCompetition = await this.createCompetition(competition);
      const nowIso = new Date().toISOString();

      const nextSubmissions = [...submissions];
      nextSubmissions[submissionIndex] = {
        ...submission,
        status: "approved",
        reviewedAt: nowIso,
        updatedAt: nowIso,
      };

      await writeLocalSubmissions(nextSubmissions);
      return createdCompetition;
    },
    async rejectSubmission(submissionId: string): Promise<string> {
      const submissions = await readLocalSubmissions();
      const submissionIndex = submissions.findIndex(
        (submission) => submission.id === submissionId,
      );

      if (submissionIndex === -1) {
        throw new Error(`Pengajuan dengan ID ${submissionId} tidak ditemukan.`);
      }

      const submission = submissions[submissionIndex];

      if (submission.status !== "pending") {
        throw new Error(
          `Pengajuan dengan ID ${submissionId} sudah pernah direview.`,
        );
      }

      const nowIso = new Date().toISOString();
      const nextSubmissions = [...submissions];
      nextSubmissions[submissionIndex] = {
        ...submission,
        status: "rejected",
        reviewedAt: nowIso,
        updatedAt: nowIso,
      };

      await writeLocalSubmissions(nextSubmissions);
      return submissionId;
    },
    async deleteSubmission(submissionId: string): Promise<string> {
      const submissions = await readLocalSubmissions();
      const nextSubmissions = submissions.filter(
        (submission) => submission.id !== submissionId,
      );

      if (nextSubmissions.length === submissions.length) {
        throw new Error(`Pengajuan dengan ID ${submissionId} tidak ditemukan.`);
      }

      await writeLocalSubmissions(nextSubmissions);
      return submissionId;
    },
  };
}

function createSupabaseCompetitionStore(supabase: SupabaseClient): CompetitionStore {
  const competitionTableName = getSupabaseTableName();
  const submissionTableName = getSupabaseSubmissionTableName();

  return {
    source: "supabase",
    async listCompetitions(): Promise<Competition[]> {
      const { data, error } = await supabase
        .from(competitionTableName)
        .select(
          "id,name,slug,organizer,category,regStart,regEnd,eventStart,eventEnd,isPriority,hasGuidebook,links",
        );

      if (error) {
        throw new Error(`Gagal mengambil data dari Supabase: ${error.message}`);
      }

      return (data ?? []).map((row) =>
        fromSupabaseCompetitionRow(row as SupabaseCompetitionRow),
      );
    },
    async createCompetition(competition: Competition): Promise<Competition> {
      const competitions = await this.listCompetitions();
      ensurePriorityLimit(competitions, competition);

      const { data, error } = await supabase
        .from(competitionTableName)
        .insert(toSupabaseCompetitionRow(competition))
        .select(
          "id,name,slug,organizer,category,regStart,regEnd,eventStart,eventEnd,isPriority,hasGuidebook,links",
        )
        .single();

      if (error) {
        throw new Error(`Gagal membuat data di Supabase: ${error.message}`);
      }

      return fromSupabaseCompetitionRow(data as SupabaseCompetitionRow);
    },
    async updateCompetition(
      competitionId: string,
      competition: Competition,
    ): Promise<Competition> {
      const competitions = await this.listCompetitions();
      ensurePriorityLimit(competitions, competition, competitionId);

      const { data, error } = await supabase
        .from(competitionTableName)
        .update(toSupabaseCompetitionRow(competition))
        .eq("id", competitionId)
        .select(
          "id,name,slug,organizer,category,regStart,regEnd,eventStart,eventEnd,isPriority,hasGuidebook,links",
        )
        .single();

      if (error) {
        throw new Error(`Gagal memperbarui data di Supabase: ${error.message}`);
      }

      return fromSupabaseCompetitionRow(data as SupabaseCompetitionRow);
    },
    async deleteCompetition(competitionId: string): Promise<string> {
      const { error } = await supabase
        .from(competitionTableName)
        .delete()
        .eq("id", competitionId);

      if (error) {
        throw new Error(`Gagal menghapus data di Supabase: ${error.message}`);
      }

      return competitionId;
    },
    async listSubmissions(): Promise<CompetitionSubmission[]> {
      const { data, error } = await supabase
        .from(submissionTableName)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(
          `Gagal mengambil data pengajuan dari Supabase: ${error.message}`,
        );
      }

      return (data ?? []).map((row) =>
        fromSupabaseSubmissionRow(row as SupabaseSubmissionRow),
      );
    },
    async createSubmission(
      submission: CompetitionSubmission,
    ): Promise<CompetitionSubmission> {
      const { data, error } = await supabase
        .from(submissionTableName)
        .insert(toSupabaseSubmissionPayload(submission))
        .select("*")
        .single();

      if (error) {
        throw new Error(`Gagal membuat pengajuan di Supabase: ${error.message}`);
      }

      return fromSupabaseSubmissionRow(data as SupabaseSubmissionRow);
    },
    async approveSubmission(submissionId: string): Promise<Competition> {
      const { data: rawSubmission, error: submissionError } = await supabase
        .from(submissionTableName)
        .select("*")
        .eq("id", submissionId)
        .single();

      if (submissionError || !rawSubmission) {
        throw new Error(`Pengajuan dengan ID ${submissionId} tidak ditemukan.`);
      }

      const submission = fromSupabaseSubmissionRow(
        rawSubmission as SupabaseSubmissionRow,
      );

      if (!canApproveSubmission(submission)) {
        throw new Error(
          `Pengajuan dengan ID ${submissionId} belum bisa disetujui karena status saat ini ${submission.status} atau pembayaran belum valid.`,
        );
      }

      const competitions = await this.listCompetitions();
      const newCompetitionId = getNextCompetitionId(competitions);
      const competition = submissionToCompetition(
        {
          ...submission,
          slug: createSlug(submission.name),
        },
        newCompetitionId,
      );

      const createdCompetition = await this.createCompetition(competition);
      const nowIso = new Date().toISOString();

      const { error: updateError } = await supabase
        .from(submissionTableName)
        .update({
          status: "approved",
          reviewed_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", submissionId);

      if (updateError) {
        throw new Error(
          `Gagal memperbarui status pengajuan: ${updateError.message}`,
        );
      }

      return createdCompetition;
    },
    async rejectSubmission(submissionId: string): Promise<string> {
      const { data: rawSubmission, error: submissionError } = await supabase
        .from(submissionTableName)
        .select("*")
        .eq("id", submissionId)
        .single();

      if (submissionError || !rawSubmission) {
        throw new Error(`Pengajuan dengan ID ${submissionId} tidak ditemukan.`);
      }

      const submission = fromSupabaseSubmissionRow(
        rawSubmission as SupabaseSubmissionRow,
      );

      if (submission.status !== "pending") {
        throw new Error(
          `Pengajuan dengan ID ${submissionId} sudah pernah direview.`,
        );
      }

      const nowIso = new Date().toISOString();
      const { error: updateError } = await supabase
        .from(submissionTableName)
        .update({
          status: "rejected",
          reviewed_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", submissionId);

      if (updateError) {
        throw new Error(
          `Gagal memperbarui status pengajuan: ${updateError.message}`,
        );
      }

      return submissionId;
    },
    async deleteSubmission(submissionId: string): Promise<string> {
      const { error } = await supabase
        .from(submissionTableName)
        .delete()
        .eq("id", submissionId);

      if (error) {
        throw new Error(`Gagal menghapus pengajuan di Supabase: ${error.message}`);
      }

      return submissionId;
    },
  };
}

export function createCompetitionStore(): CompetitionStore {
  const supabase = createSupabaseCompetitionClient();

  if (supabase) {
    return createSupabaseCompetitionStore(supabase);
  }

  return createLocalCompetitionStore();
}

export function createSubmissionStore(): Pick<
  CompetitionStore,
  "listSubmissions" | "createSubmission" | "approveSubmission" | "rejectSubmission" | "deleteSubmission" | "source"
> {
  const store = createCompetitionStore();

  return {
    listSubmissions: store.listSubmissions.bind(store),
    createSubmission: store.createSubmission.bind(store),
    approveSubmission: store.approveSubmission.bind(store),
    rejectSubmission: store.rejectSubmission.bind(store),
    deleteSubmission: store.deleteSubmission.bind(store),
    source: store.source,
  };
}

export async function readLocalCompetitionsForMigration(): Promise<Competition[]> {
  return await readLocalCompetitions();
}

export function createSupabaseClientForMigration(): SupabaseClient {
  const supabase = createSupabaseCompetitionClient();

  if (!supabase) {
    throw new Error(
      "SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi sebelum migrasi.",
    );
  }

  return supabase;
}

export function getSupabaseCompetitionTableName(): string {
  return getSupabaseTableName();
}

export function mapCompetitionToSupabaseRow(
  competition: Competition,
): SupabaseCompetitionRow {
  return toSupabaseCompetitionRow(competition);
}
