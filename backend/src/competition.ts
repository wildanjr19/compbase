import { z } from "zod";
import {
  COMPETITION_CATEGORIES,
  competitionCategorySchema,
  competitionLinksSchema,
  competitionSchema,
  normalizeCompetitionCategoryLabel,
  optionalDateSchema,
  optionalUrlSchema,
  type CompetitionCategory,
} from "../../frontend/lib/shared/schemas/competition.ts";

export {
  COMPETITION_CATEGORIES,
  competitionCategorySchema,
  competitionLinksSchema,
  competitionSchema,
  normalizeCompetitionCategoryLabel,
  optionalDateSchema,
  optionalUrlSchema,
  type CompetitionCategory,
};

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
