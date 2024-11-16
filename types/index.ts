import { ReactNode } from "react";

// Base Types
export interface Donation {
  id: string;
  amount: string;
  donor: string;
  timestamp: number;
  causeId: string;
  causeName: string;
  impactScore: string;
}

export interface Withdrawal {
  id: string;
  amount: string;
  timestamp: number;
  causeId: string;
  beneficiary: string;
}

export interface Milestone {
  id: string;
  causeId: string;
  index: string;
  completionTime: number;
}

export interface Cause {
  id: string;
  causeId: string;
  name: string;
  description: string;
  targetAmount: string;
  beneficiary: string;
  createdAt: number;
  timestamp: number;
  donationCount: number;
  donations: Donation[];
  withdrawals: Withdrawal[];
  milestones: Milestone[];
}

// API Response Types
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface SearchResponse<T> {
  items: T[];
}

export type PaginatedCauses = PaginatedResponse<Cause>;
export type SearchCauses = SearchResponse<Cause>;

// Component Props Types
export interface CauseDetailsProps {
  cause: Cause;
}

export interface DonateCauseDialogProps {
  cause: Cause;
  children: ReactNode;
}

// Activity Types
export interface Activity {
  id: string;
  transactionHash: string;
  type: "donation" | "withdrawal" | "milestone" | "badge";
  timestamp: number;
  donor?: string;
  amount?: string;
  beneficiary?: string;
  milestoneIndex?: string;
  badgeType?: string;
  causeId: string;
  causeName: string;
  impactScore?: number;
}

// API Route Types
export interface CauseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface SearchQueryParams {
  q: string;
  limit?: number;
}

// Pagination Types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  likesCount: number;
  timestamp: number;
  replies?: Comment[];
}

export interface CommentsResponse {
  items: Comment[];
  nextCursor: string | null;
}
