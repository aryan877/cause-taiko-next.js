import { ReactNode } from "react";

export interface Donation {
  id: string;
  amount: string;
  donor: string;
  timestamp: number;
  causeId: string;
  causeName: string;
  impactScore: string;
  transactionHash: string;
}

export interface Withdrawal {
  id: string;
  amount: string;
  timestamp: number;
  causeId: string;
  beneficiary: string;
  transactionHash: string;
}

export interface Milestone {
  id: string;
  causeId: string;
  description: string;
  targetAmount: string;
  isCompleted: boolean;
  completionTime: number | null;
  createdAt: number;
  transactionHash: string;
  index: string;
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
  topDonors?: TopDonor[];
  totalDonated?: string;
  totalWithdrawn?: string;
  remainingAmount?: string;
  isFeatured?: boolean;
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

export interface TopDonor {
  address: string;
  totalDonated: string;
  donationCount: number;
}

export interface UserProfile {
  address: string;
  totalDonated: string;
  donationCount: number;
  causesSupported: number;
  impactScore: string;
  badges: {
    type: string;
    earnedAt: number;
    transactionHash: string;
  }[];
  donations: {
    id: string;
    amount: string;
    causeId: string;
    causeName: string;
    timestamp: number;
    transactionHash: string;
    impactScore: string;
  }[];
}
