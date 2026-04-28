import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  COMPETITION_CATEGORIES,
  competitionLinksSchema,
  createSlug,
  optionalDateSchema,
  type Competition,
  type CompetitionCategory,
  type CompetitionLinks,
} from "./competition.ts";

export const SUBMISSION_STATUS_VALUES = [
  "pending",
  "approved",
  "rejected",
] as const;

export const PAYMENT_STATUS_VALUES = [
  "unpaid",
  "paid",
  "waived",
] as const;

export const competitionSubmissionSchema = z
  .object({
    name: z.string().trim().min(1, "Nama kompetisi wajib diisi."),
    organizer: z.string().trim().min(1, "Nama penyelenggara wajib diisi."),
    category: z.enum(COMPETITION_CATEGORIES),
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
  .superRefine((data, context) => {
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
  });

export type SubmissionStatus = (typeof SUBMISSION_STATUS_VALUES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

export interface CompetitionSubmission {
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
  submitterName: string;
  submitterEmail: string;
  notes: string;
  status: SubmissionStatus;
  paymentStatus: PaymentStatus;
  reviewedBy: string;
  reviewedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type CompetitionSubmissionCreateInput = z.infer<
  typeof competitionSubmissionSchema
>;

export function normalizeSubmissionInput(
  input: CompetitionSubmissionCreateInput,
): CompetitionSubmission {
  const nowIso = new Date().toISOString();
  const links: CompetitionLinks = {
    registration: input.links.registration.trim(),
    guidebook: input.links.guidebook.trim(),
    instagram: input.links.instagram.trim(),
    linktree: input.links.linktree.trim(),
    website: input.links.website.trim(),
  };

  return {
    id: randomUUID(),
    name: input.name.trim(),
    slug: createSlug(input.name),
    organizer: input.organizer.trim(),
    category: input.category,
    regStart: input.regStart.trim(),
    regEnd: input.regEnd.trim(),
    eventStart: input.eventStart.trim(),
    eventEnd: input.eventEnd.trim(),
    isPriority: false,
    hasGuidebook: Boolean(links.guidebook),
    links,
    submitterName: input.submitterName.trim(),
    submitterEmail: input.submitterEmail.trim().toLowerCase(),
    notes: input.notes.trim(),
    status: "pending",
    paymentStatus: "waived",
    reviewedBy: "",
    reviewedAt: "",
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function toCompetitionSubmission(
  row: Record<string, unknown>,
): CompetitionSubmission {
  const links = (row.links as CompetitionLinks | undefined) ?? {};

  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? "").trim(),
    slug: String(row.slug ?? "").trim(),
    organizer: String(row.organizer ?? "").trim(),
    category: String(row.category ?? "") as CompetitionCategory,
    regStart: String(row.reg_start ?? row.regStart ?? ""),
    regEnd: String(row.reg_end ?? row.regEnd ?? ""),
    eventStart: String(row.event_start ?? row.eventStart ?? ""),
    eventEnd: String(row.event_end ?? row.eventEnd ?? ""),
    isPriority: Boolean(row.is_priority ?? row.isPriority ?? false),
    hasGuidebook: Boolean(row.has_guidebook ?? row.hasGuidebook ?? false),
    links: {
      registration: links.registration ?? "",
      guidebook: links.guidebook ?? "",
      instagram: links.instagram ?? "",
      linktree: links.linktree ?? "",
      website: links.website ?? "",
    },
    submitterName: String(row.submitter_name ?? row.submitterName ?? "").trim(),
    submitterEmail: String(
      row.submitter_email ?? row.submitterEmail ?? "",
    )
      .trim()
      .toLowerCase(),
    notes: String(row.notes ?? "").trim(),
    status: String(row.status ?? "pending") as SubmissionStatus,
    paymentStatus: String(
      row.payment_status ?? row.paymentStatus ?? "waived",
    ) as PaymentStatus,
    reviewedBy: String(row.reviewed_by ?? row.reviewedBy ?? "").trim(),
    reviewedAt: String(row.reviewed_at ?? row.reviewedAt ?? "").trim(),
    createdAt: String(
      row.created_at ?? row.createdAt ?? new Date().toISOString(),
    ).trim(),
    updatedAt: String(
      row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
    ).trim(),
  };
}

export function submissionToCompetition(
  submission: CompetitionSubmission,
  newId: string,
): Competition {
  return {
    id: newId,
    name: submission.name,
    slug: submission.slug,
    organizer: submission.organizer,
    category: submission.category,
    regStart: submission.regStart,
    regEnd: submission.regEnd,
    eventStart: submission.eventStart,
    eventEnd: submission.eventEnd,
    isPriority: false,
    hasGuidebook: submission.hasGuidebook,
    links: submission.links,
  };
}
