export type Role = "USER" | "MENTOR" | "ADMIN";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  address?: string | null;
  bio?: string | null;
  occupation?: string | null;
  expertise?: string | null;
}

export type SessionStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";

export interface MentorshipSession {
  id: string;
  questions: string;
  status: SessionStatus;
  createdAt: string;
  scheduledAt?: string | null;
  durationMinutes?: number | null;
  rejectReason?: string | null;
  mentor: User;
  mentee: User;
}

export type HideRequestStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export interface Review {
  id: string;
  remark: string;
  score: number;
  isHidden: boolean;
  hideRequestStatus: HideRequestStatus;
  mentor: User;
  mentee: User;
}

export type PromotionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PromotionRequest {
  id: string;
  expertise: string;
  occupation: string;
  status: PromotionStatus;
  createdAt: string;
  user: User;
}