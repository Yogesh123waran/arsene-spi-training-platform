/**
 * PART 3 UI-only mock data for the Reports module.
 *
 * Deliberately holds no component/function references — this is
 * passed from Server Components (admin/reports, trainer/reports)
 * into a Client Component (ReportsGrid), and React Server Components
 * can only pass serializable data across that boundary. The actual
 * icon lookup lives in ReportsGrid.tsx itself, keyed by `iconKey`.
 */
export type ReportIconKey = "students" | "attendance" | "course" | "batch" | "trainer" | "tests";

export interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  iconKey: ReportIconKey;
  lastGenerated: string;
}

export const reportDefinitions: ReportDefinition[] = [
  { id: "rep_students", title: "Student Performance", description: "Scores, attendance and progress per student.", iconKey: "students", lastGenerated: "2026-05-20" },
  { id: "rep_attendance", title: "Attendance", description: "Daily and cumulative attendance across batches.", iconKey: "attendance", lastGenerated: "2026-05-24" },
  { id: "rep_course", title: "Course Progress", description: "Module completion across every active course.", iconKey: "course", lastGenerated: "2026-05-18" },
  { id: "rep_batch", title: "Batch Performance", description: "Aggregate scores and attendance per batch.", iconKey: "batch", lastGenerated: "2026-05-22" },
  { id: "rep_trainer", title: "Trainer Performance", description: "Student outcomes grouped by trainer.", iconKey: "trainer", lastGenerated: "2026-05-15" },
  { id: "rep_tests", title: "Test Results", description: "Pass rates and score distribution per test.", iconKey: "tests", lastGenerated: "2026-05-26" },
];
