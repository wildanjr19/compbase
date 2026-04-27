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
  "Olympiad",
] as const;

const optionalUrlSchema = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .url("Tautan harus menggunakan URL valid dengan protokol http atau https."),
]);

const optionalDateSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
    "Format tanggal harus YYYY-MM-DD.",
  );

export const publicSubmissionSchema = z
  .object({
    name: z.string().trim().min(1, "Nama kompetisi wajib diisi."),
    organizer: z.string().trim().min(1, "Nama penyelenggara wajib diisi."),
    category: z.enum(COMPETITION_CATEGORIES),
    regStart: optionalDateSchema,
    regEnd: optionalDateSchema,
    eventStart: optionalDateSchema,
    eventEnd: optionalDateSchema,
    links: z.object({
      registration: optionalUrlSchema.optional().default(""),
      guidebook: optionalUrlSchema.optional().default(""),
      instagram: optionalUrlSchema.optional().default(""),
      linktree: optionalUrlSchema.optional().default(""),
      website: optionalUrlSchema.optional().default(""),
    }),
    submitterName: z.string().trim().min(1, "Nama pengaju wajib diisi."),
    submitterEmail: z
      .string()
      .trim()
      .email("Email pengaju harus menggunakan format email valid."),
    notes: z.string().trim().optional().default(""),
    honeypot: z.string().trim().optional().default(""),
  })
  .superRefine((submission, context) => {
    if (
      submission.regStart &&
      submission.regEnd &&
      submission.regStart > submission.regEnd
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Tanggal buka registrasi tidak boleh melewati tanggal tutup registrasi.",
        path: ["regStart"],
      });
    }

    if (
      submission.eventStart &&
      submission.eventEnd &&
      submission.eventStart > submission.eventEnd
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Tanggal mulai penyisihan tidak boleh melewati tanggal selesai penyisihan.",
        path: ["eventStart"],
      });
    }

    if (
      submission.regEnd &&
      submission.eventEnd &&
      submission.regEnd > submission.eventEnd
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Deadline pendaftaran tidak boleh melewati akhir penyisihan.",
        path: ["regEnd"],
      });
    }
  });

export type PublicSubmissionInput = z.output<typeof publicSubmissionSchema>;
