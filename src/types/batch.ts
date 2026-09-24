export type BatchStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface Batch {
  id: string;
  batchCode: string;
  courseId: string;
  trainerId: string;
  title: string;
  startDate: string;
  endDate: string;
  status: BatchStatus;
  studentIds: string[];
  maxSeats: number;
  createdAt: string;
  updatedAt: string;
}
