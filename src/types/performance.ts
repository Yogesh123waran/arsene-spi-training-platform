export interface StudentPerformance {
  studentId: string;
  courseId: string;
  attendancePercentage: number;
  averageTestScore: number;
  testsTaken: number;
  testsPassed: number;
  overallGrade?: string;
  lastUpdated: string;
}
