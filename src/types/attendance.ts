export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  status: AttendanceStatus;
  markedAt: string;
  markedBy: string;
  remarks?: string;
}
