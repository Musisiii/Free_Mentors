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
  mentor: User;
  mentee: User;
}

export interface Review {
  id: string;
  remark: string;
  score: number;
  isHidden: boolean;
  mentor: User;
  mentee: User;
}
