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

export type CompetitionStatus = "coming-soon" | "open" | "closed";

export type CompetitionCategory =
  | "Data Science"
  | "Datathon"
  | "Data Mining"
  | "Essay"
  | "Hackathon"
  | "LKTI"
  | "Olympiad"
  | "Infografis"
  | "Dashboard";

export type CompetitionTab = "all" | "coming-soon" | "open";

export type CompetitionSort = "deadline" | "name";

export interface CompetitionFilters {
  query: string;
  category: string;
  tab: CompetitionTab;
  sort: CompetitionSort;
}

export interface CompetitionStats {
  total: number;
  comingSoon: number;
  open: number;
  priority: number;
}

export type SubmissionStatus = "pending" | "approved" | "rejected";
export type SubmissionPaymentStatus = "unpaid" | "paid" | "waived";

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
  paymentStatus: SubmissionPaymentStatus;
  reviewedBy: string;
  reviewedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitionSubmissionCreateInput {
  name: string;
  organizer: string;
  category: CompetitionCategory;
  regStart: string;
  regEnd: string;
  eventStart: string;
  eventEnd: string;
  links: CompetitionLinks;
  submitterName: string;
  submitterEmail: string;
  notes: string;
  honeypot?: string;
}
