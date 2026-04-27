import { z } from "zod";

export const COMPETITION_CATEGORIES = [
  "Dashboard",
  "Data Mining",
  "Data Science",
  "Datathon",
  "Essay",
  "Hackathon",
  "Infografis",
  "LKTI",
  "Olympiad",
] as const;

export type CompetitionCategory = (typeof COMPETITION_CATEGORIES)[number];

export interface CompetitionLinks {
  registration?: string;
  guidebook?: string;
  instagram?: string;
  linktree?: string;
  website?: string;
}

export interface Competition {
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

export const optionalUrlSchema = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .url("Tautan harus menggunakan URL valid dengan protokol http atau https."),
]);

export const optionalDateSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || isDateString(value),
    "Format tanggal harus YYYY-MM-DD.",
  );

export const competitionLinksSchema = z.object({
  registration: optionalUrlSchema.optional().default(""),
  guidebook: optionalUrlSchema.optional().default(""),
  instagram: optionalUrlSchema.optional().default(""),
  linktree: optionalUrlSchema.optional().default(""),
  website: optionalUrlSchema.optional().default(""),
});

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export const competitionSchema = z
  .object({
    id: z.string().trim().min(1, "ID kompetisi wajib diisi."),
    name: z.string().trim().min(1, "Nama kompetisi wajib diisi."),
    slug: z.string().trim().min(1, "Slug kompetisi wajib diisi."),
    organizer: z.string().trim().min(1, "Nama penyelenggara wajib diisi."),
    category: z.enum(COMPETITION_CATEGORIES),
    regStart: optionalDateSchema,
    regEnd: optionalDateSchema,
    eventStart: optionalDateSchema,
    eventEnd: optionalDateSchema,
    isPriority: z.boolean(),
    hasGuidebook: z.boolean(),
    links: competitionLinksSchema,
  })
  .superRefine((competition, context) => {
    if (
      competition.regStart &&
      competition.regEnd &&
      competition.regStart > competition.regEnd
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Tanggal buka registrasi tidak boleh melewati tanggal tutup registrasi.",
        path: ["regStart"],
      });
    }

    if (
      competition.eventStart &&
      competition.eventEnd &&
      competition.eventStart > competition.eventEnd
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Tanggal mulai penyisihan tidak boleh melewati tanggal selesai penyisihan.",
        path: ["eventStart"],
      });
    }

    if (
      competition.regEnd &&
      competition.eventEnd &&
      competition.regEnd > competition.eventEnd
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Deadline pendaftaran tidak boleh melewati akhir penyisihan.",
        path: ["regEnd"],
      });
    }
  });

export function normalizeCompetition(
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

export function createSlug(name: string): string {
  const normalizedName = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return normalizedName ? normalizedName : "kompetisi";
}

export function getNextCompetitionId(competitions: Competition[]): string {
  const highestIndex = competitions.reduce<number>(
    (currentHighest, competition) => {
      const numericPart = Number.parseInt(
        competition.id.replace("cmp-", ""),
        10,
      );

      if (Number.isNaN(numericPart)) {
        return currentHighest;
      }

      return Math.max(currentHighest, numericPart);
    },
    0,
  );

  return `cmp-${String(highestIndex + 1).padStart(3, "0")}`;
}

export function getValidationMessages(error: z.ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}
