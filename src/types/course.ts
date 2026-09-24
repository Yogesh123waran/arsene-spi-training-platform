export type CourseLevel = "foundation" | "intermediate" | "advanced";

export type CourseStatus = "draft" | "published" | "archived";

export interface Course {
  id: string;
  courseCode: string;
  title: string;
  description: string;
  level: CourseLevel;
  durationHours: number;
  status: CourseStatus;
  moduleIds: string[];
  createdAt: string;
  updatedAt: string;
}
