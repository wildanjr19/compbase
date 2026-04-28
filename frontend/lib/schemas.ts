import { z } from "zod";
import { competitionSchema } from "@/lib/shared/schemas/competition";

export { competitionSchema };

export type CompetitionSchemaInput = z.input<typeof competitionSchema>;
export type CompetitionSchemaValue = z.output<typeof competitionSchema>;
