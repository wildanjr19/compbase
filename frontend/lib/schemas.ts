import { z } from "zod";
import type { CompetitionCategory } from "@/lib/types";

const COMPETITION_CATEGORIES = [
  "Dashboard",
  "Data Mining",
  "Data Science",
  "Datathon",
  "Essay",
  "Hackathon",
  "Infografis",
  "LKTI",
] as const satisfies readonly CompetitionCategory[];

const optionalUrlSchema = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .url("Tautan harus menggunakan URL valid dengan protokol http atau https."),
]);

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
    regStart: z
      .string()
      .trim()
      .refine(isDateString, "Format tanggal buka registrasi harus YYYY-MM-DD."),
    regEnd: z
      .string()
      .trim()
      .refine(isDateString, "Format tanggal tutup registrasi harus YYYY-MM-DD."),
    eventStart: z
      .string()
      .trim()
      .refine(isDateString, "Format tanggal mulai pelaksanaan harus YYYY-MM-DD."),
    eventEnd: z
      .string()
      .trim()
      .refine(isDateString, "Format tanggal selesai pelaksanaan harus YYYY-MM-DD."),
    isPriority: z.boolean(),
    hasGuidebook: z.boolean(),
    description: z.string().trim().min(1, "Deskripsi kompetisi wajib diisi."),
    links: z.object({
      registration: optionalUrlSchema.optional().default(""),
      guidebook: optionalUrlSchema.optional().default(""),
      instagram: optionalUrlSchema.optional().default(""),
      linktree: optionalUrlSchema.optional().default(""),
      website: optionalUrlSchema.optional().default(""),
    }),
  })
  .superRefine((competition, context) => {
    if (competition.regStart > competition.regEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tanggal buka registrasi tidak boleh melewati tanggal tutup registrasi.",
        path: ["regStart"],
      });
    }

    if (competition.eventStart > competition.eventEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tanggal mulai pelaksanaan tidak boleh melewati tanggal selesai pelaksanaan.",
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

export type CompetitionSchemaInput = z.input<typeof competitionSchema>;
export type CompetitionSchemaValue = z.output<typeof competitionSchema>;
