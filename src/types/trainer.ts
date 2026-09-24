import type { UserStatus } from "./user";

export interface Trainer {
  id: string;
  userId: string;
  trainerCode: string;
  fullName: string;
  email: string;
  phone?: string;
  specializations: string[];
  bio?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}
