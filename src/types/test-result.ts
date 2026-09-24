export type ResultStatus = "pass" | "fail" | "pending_review";

export interface TestResult {
  id: string;
  testId: string;
  studentId: string;
  attemptId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: ResultStatus;
  publishedAt?: string;
}
