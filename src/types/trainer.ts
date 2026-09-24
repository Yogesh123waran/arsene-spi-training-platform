import type { UserStatus } from "./user";

/**
 * A trainer as the app presents it: public.trainers (code, name,
 * status) plus public.trainer_details (email, phone, specializations,
 * bio — readable only by super_admin and the trainer themselves).
 * `id` is the trainer's profiles.id — the same id as their auth user;
 * there is no separate user id.
 */
export interface Trainer {
  id: string;
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
