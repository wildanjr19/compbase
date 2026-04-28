import { z } from "zod";
import { publicSubmissionSchema } from "@/lib/shared/schemas/submission";

export { publicSubmissionSchema };

export type PublicSubmissionInput = z.output<typeof publicSubmissionSchema>;
