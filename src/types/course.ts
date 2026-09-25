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

/**
 * A course as shown on the Courses grid. Built from public.courses +
 * its modules + its batches' trainers (Supabase mode), or from the
 * demo data (demo mode).
 *
 * `topics` and `progress` have no data source in the database yet
 * (topics aren't modelled; progress needs Attendance/Tests), so they
 * are left undefined there and the UI hides them.
 */
export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  status: CourseStatus;
  modules: number;
  durationHours: number;
  /** Batch trainer name(s), or "Trainer not assigned". */
  trainer: string;
  topics?: number;
  progress?: number;
}

export type CourseModuleProgress = "completed" | "in_progress" | "not_started";

export interface CourseDetailModule {
  id: string;
  sequence: number;
  title: string;
  /** Not modelled in the database yet — hidden when undefined. */
  topics?: number;
  /** Learner progress — hidden when undefined (no Attendance/Tests data yet). */
  status?: CourseModuleProgress;
}

/** A single course as shown on the course detail page. */
export interface CourseDetail {
  id: string;
  title: string;
  description: string;
  durationHours: number;
  /** Batch trainer name(s), or "Trainer not assigned". */
  trainer: string;
  modules: CourseDetailModule[];
  topics?: number;
  progress?: number;
}
