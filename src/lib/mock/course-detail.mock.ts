/** PART 3 UI-only mock detail data for a single course (course detail layout). */
export interface CourseModuleRow {
  id: string;
  sequence: number;
  title: string;
  topics: number;
  status: "completed" | "in_progress" | "not_started";
}

export interface CourseDetailData {
  id: string;
  title: string;
  description: string;
  modules: CourseModuleRow[];
  progress: number;
  trainer: string;
  durationHours: number;
  topics: number;
}

export const courseDetails: Record<string, CourseDetailData> = {
  crs_001: {
    id: "crs_001",
    title: "Instrumentation Basics",
    description:
      "Learn the fundamentals of process instrumentation including sensors, transmitters and control systems.",
    trainer: "Rajesh Kumar",
    durationHours: 40,
    topics: 24,
    progress: 68,
    modules: [
      { id: "mod_1", sequence: 1, title: "Introduction to Instrumentation", topics: 4, status: "completed" },
      { id: "mod_2", sequence: 2, title: "Sensors and Transmitters", topics: 5, status: "in_progress" },
      { id: "mod_3", sequence: 3, title: "Control Valves", topics: 4, status: "not_started" },
      { id: "mod_4", sequence: 4, title: "Signal Conditioning", topics: 3, status: "not_started" },
    ],
  },
};

export const defaultCourseDetail = courseDetails.crs_001!;
