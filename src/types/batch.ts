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
