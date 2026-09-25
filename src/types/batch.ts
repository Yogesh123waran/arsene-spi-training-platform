export type BatchStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

/**
 * Mirrors public.batches (0003_core_training_model.sql). Enrolled
 * students live in batch_students and are not stored on the batch.
 */
export interface Batch {
  id: string;
  batchCode: string;
  courseId: string;
  /** Null until a trainer is assigned. */
  trainerId: string | null;
  name: string;
  startDate: string;
  endDate: string;
  status: BatchStatus;
  maxSeats: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * A batch as shown in the Batches table (admin and trainer). Built from
 * public.batches + its course, trainer and enrolments (Supabase mode),
 * or from the demo data (demo mode).
 */
export interface BatchSummary {
  id: string;
  name: string;
  course: string;
  /** Assigned trainer's name, or "Trainer not assigned". */
  trainer: string;
  /** Distinct students whose enrolment isn't withdrawn (enrolled + completed) — the seats in use. */
  students: number;
  maxSeats: number;
  /** ISO date, YYYY-MM-DD. */
  startDate: string;
  /** ISO date, YYYY-MM-DD. */
  endDate: string;
  status: BatchStatus;
}
