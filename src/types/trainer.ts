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

/**
 * A trainer as shown in the Admin Trainers table. Built from
 * public.trainers + trainer_details + the trainer's batches (Supabase
 * mode), or from the demo data (demo mode).
 */
export interface TrainerSummary {
  id: string;
  name: string;
  /** trainer_details.email; empty string when no details row exists. */
  email: string;
  /** Courses of the trainer's non-cancelled batches, without duplicates. */
  courses: string[];
  /** The trainer's non-cancelled batches. */
  batches: string[];
  /** Distinct students currently enrolled (enrollment_status = 'enrolled') in those batches. */
  students: number;
  status: UserStatus;
}
