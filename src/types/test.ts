export type TestType = "quiz" | "module_test" | "final_exam" | "practical";

export type TestStatus = "draft" | "scheduled" | "active" | "closed";

export interface Test {
  id: string;
  title: string;
  courseId: string;
  batchId?: string;
  type: TestType;
  status: TestStatus;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  questionIds: string[];
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}
