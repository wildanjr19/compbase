import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  competitionSchema,
  normalizeCompetition,
  type Competition,
} from "./competition.js";

interface CompetitionStore {
  listCompetitions(): Promise<Competition[]>;
  createCompetition(competition: Competition): Promise<Competition>;
  updateCompetition(
    competitionId: string,
    competition: Competition,
  ): Promise<Competition>;
  deleteCompetition(competitionId: string): Promise<string>;
  source: "supabase" | "local";
}

interface SupabaseCompetitionRow {
  id: string;
  name: string;
  slug: string;
  organizer: string;
  category: Competition["category"];
  regStart: string;
  regEnd: string;
  eventStart: string;
  eventEnd: string;
  isPriority: boolean;
  hasGuidebook: boolean;
  links: Competition["links"];
}

const backendRootPath = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultLocalDataPath = resolve(
  backendRootPath,
  ".local",
  "competitions.json",
);
const competitionArraySchema = z.array(competitionSchema);

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

function getLocalCompetitionsFilePath(): string {
  const configuredPath = process.env.LOCAL_COMPETITIONS_FILE_PATH?.trim();

  if (!configuredPath) {
    return defaultLocalDataPath;
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

function toSupabaseRow(competition: Competition): SupabaseCompetitionRow {
  return {
    ...competition,
    links: {
      registration: competition.links.registration ?? "",
      guidebook: competition.links.guidebook ?? "",
      instagram: competition.links.instagram ?? "",
      linktree: competition.links.linktree ?? "",
      website: competition.links.website ?? "",
    },
  };
}

function fromSupabaseRow(row: SupabaseCompetitionRow): Competition {
  return normalizeCompetition(
    competitionSchema.parse({
      ...row,
      links: row.links ?? {},
    }),
  );
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

async function writeLocalCompetitions(
  competitions: Competition[],
): Promise<void> {
  const filePath = getLocalCompetitionsFilePath();
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(competitions, null, 2), "utf8");
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
  };
}

function createSupabaseCompetitionStore(
  supabase: SupabaseClient,
): CompetitionStore {
  const tableName = getSupabaseTableName();

  return {
    source: "supabase",
    async listCompetitions(): Promise<Competition[]> {
      const { data, error } = await supabase
        .from(tableName)
        .select(
          "id,name,slug,organizer,category,regStart,regEnd,eventStart,eventEnd,isPriority,hasGuidebook,links",
        );

      if (error) {
        throw new Error(`Gagal mengambil data dari Supabase: ${error.message}`);
      }

      return (data ?? []).map((row) =>
        fromSupabaseRow(row as SupabaseCompetitionRow),
      );
    },
    async createCompetition(competition: Competition): Promise<Competition> {
      const { data, error } = await supabase
        .from(tableName)
        .insert(toSupabaseRow(competition))
        .select(
          "id,name,slug,organizer,category,regStart,regEnd,eventStart,eventEnd,isPriority,hasGuidebook,links",
        )
        .single();

      if (error) {
        throw new Error(`Gagal membuat data di Supabase: ${error.message}`);
      }

      return fromSupabaseRow(data as SupabaseCompetitionRow);
    },
    async updateCompetition(
      competitionId: string,
      competition: Competition,
    ): Promise<Competition> {
      const { data, error } = await supabase
        .from(tableName)
        .update(toSupabaseRow(competition))
        .eq("id", competitionId)
        .select(
          "id,name,slug,organizer,category,regStart,regEnd,eventStart,eventEnd,isPriority,hasGuidebook,links",
        )
        .single();

      if (error) {
        throw new Error(`Gagal memperbarui data di Supabase: ${error.message}`);
      }

      return fromSupabaseRow(data as SupabaseCompetitionRow);
    },
    async deleteCompetition(competitionId: string): Promise<string> {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", competitionId);

      if (error) {
        throw new Error(`Gagal menghapus data di Supabase: ${error.message}`);
      }

      return competitionId;
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
  return toSupabaseRow(competition);
}
