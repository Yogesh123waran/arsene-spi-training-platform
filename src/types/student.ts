import type { UserStatus } from "./user";

export interface Student {
  id: string;
  userId: string;
  studentCode: string;
  fullName: string;
  email: string;
  phone?: string;
  organization?: string;
  designation?: string;
  enrolledBatchIds: string[];
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}
