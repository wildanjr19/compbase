import { z } from "zod";
import { competitionSubmissionInputSchema } from "./competition.ts";

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

export const competitionSubmissionSchema = competitionSubmissionInputSchema;
export const publicSubmissionSchema = competitionSubmissionInputSchema;

export type CompetitionSubmissionInput = z.infer<
  typeof competitionSubmissionSchema
>;
