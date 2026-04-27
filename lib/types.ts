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
  regStart: string;
  regEnd: string;
  eventStart: string;
  eventEnd: string;
  isPriority: boolean;
  hasGuidebook: boolean;
  description: string;
  links: CompetitionLinks;
}

export type CompetitionStatus = "open" | "closing-soon" | "closed";

export type CompetitionTab =
  | "all"
  | "open"
  | "closing-soon"
  | "priority"
  | "has-guidebook";

export type CompetitionSort = "deadline" | "name" | "organizer" | "priority";

export interface CompetitionFilters {
  query: string;
  organizer: string;
  tab: CompetitionTab;
  sort: CompetitionSort;
}

export interface CompetitionStats {
  total: number;
  open: number;
  closingSoon: number;
  priority: number;
}
