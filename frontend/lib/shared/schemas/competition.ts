import { z } from "zod";

export const COMPETITION_CATEGORIES = [
  "Dashboard",
  "Data Analytics",
  "Data Mining",
  "Data Science",
  "Datathon",
  "Essay",
  "Hackathon",
  "Infographics",
  "LKTI",
  "Olympiad",
] as const;

export type CompetitionCategory = (typeof COMPETITION_CATEGORIES)[number];

const LEGACY_CATEGORY_LABEL_MAP: Record<string, CompetitionCategory> = {
  infografis: "Infographics",
};

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
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

export function normalizeCompetitionCategoryLabel(category: string): string {
  const trimmedCategory = category.trim();

  if (!trimmedCategory) {
    return "";
  }

  const normalizedCategory = trimmedCategory.toLowerCase();
  const mappedCategory = LEGACY_CATEGORY_LABEL_MAP[normalizedCategory];

  if (mappedCategory) {
    return mappedCategory;
  }

  return trimmedCategory;
}

export const competitionCategorySchema = z
  .string()
  .trim()
  .transform((category) => normalizeCompetitionCategoryLabel(category))
  .pipe(z.enum(COMPETITION_CATEGORIES));

function applyDateRangeRules<
  TData extends {
    regStart: string;
    regEnd: string;
    eventStart: string;
    eventEnd: string;
  },
>(data: TData, context: z.RefinementCtx): void {
  if (data.regStart && data.regEnd && data.regStart > data.regEnd) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Tanggal buka registrasi tidak boleh melewati tanggal tutup registrasi.",
      path: ["regStart"],
    });
  }

  if (data.eventStart && data.eventEnd && data.eventStart > data.eventEnd) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Tanggal mulai penyisihan tidak boleh melewati tanggal selesai penyisihan.",
      path: ["eventStart"],
    });
  }

  if (data.regEnd && data.eventEnd && data.regEnd > data.eventEnd) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Deadline pendaftaran tidak boleh melewati akhir penyisihan.",
      path: ["regEnd"],
    });
  }
}

export const competitionSchema = z
  .object({
    id: z.string().trim().min(1, "ID kompetisi wajib diisi."),
    name: z.string().trim().min(1, "Nama kompetisi wajib diisi."),
    slug: z.string().trim().min(1, "Slug kompetisi wajib diisi."),
    organizer: z.string().trim().min(1, "Nama penyelenggara wajib diisi."),
    category: competitionCategorySchema,
    regStart: optionalDateSchema,
    regEnd: optionalDateSchema,
    eventStart: optionalDateSchema,
    eventEnd: optionalDateSchema,
    isPriority: z.boolean(),
    hasGuidebook: z.boolean(),
    links: competitionLinksSchema,
  })
  .superRefine((competition, context) => {
    applyDateRangeRules(competition, context);
  });

export const competitionSubmissionInputSchema = z
  .object({
    name: z.string().trim().min(1, "Nama kompetisi wajib diisi."),
    organizer: z.string().trim().min(1, "Nama penyelenggara wajib diisi."),
    category: competitionCategorySchema,
    regStart: optionalDateSchema,
    regEnd: optionalDateSchema,
    eventStart: optionalDateSchema,
    eventEnd: optionalDateSchema,
    links: competitionLinksSchema,
    submitterName: z.string().trim().min(1, "Nama pengaju wajib diisi."),
    submitterEmail: z
      .string()
      .trim()
      .email("Email pengaju harus menggunakan format email valid."),
    notes: z.string().trim().optional().default(""),
    honeypot: z.string().trim().optional().default(""),
  })
  .superRefine((submission, context) => {
    applyDateRangeRules(submission, context);
  });
