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
  description: string;
  links: CompetitionLinks;
}

export type CompetitionStatus = "open" | "closing-soon" | "closed";

export type CompetitionCategory =
  | "Data Science"
  | "Datathon"
  | "Data Mining"
  | "Essay"
  | "Hackathon"
  | "LKTI"
  | "Infografis"
  | "Dashboard";

export type CompetitionTab =
  | "all"
  | "open"
  | "closing-soon"
  | "has-guidebook";

export type CompetitionSort = "deadline" | "name" | "organizer";

export interface CompetitionFilters {
  query: string;
  category: string;
  tab: CompetitionTab;
  sort: CompetitionSort;
}

export interface CompetitionStats {
  total: number;
  open: number;
  closingSoon: number;
  priority: number;
}
