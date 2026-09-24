import type { StudentPerformance } from "@/types";
import { simulateLatency } from "./base.repository";

/**
 * PART 2 placeholder.
 *
 * StudentPerformance (src/types/performance.ts) is a per-student,
 * per-course summary record — it has no single `id` field. Its
 * natural identifier is the existing (studentId, courseId) pair, not
 * a fabricated database column. That doesn't fit the generic,
 * single-id `Repository<T>` shape used by the other stub
 * repositories, so this repository intentionally exposes its own
 * composite-key methods instead of implementing `Repository<StudentPerformance>`.
 *
 * Swap the in-memory array below for real Supabase queries when the
 * performance table is implemented (the composite key maps naturally
 * to a `(student_id, course_id)` unique constraint / primary key).
 */
class PerformanceRepository {
  private records: StudentPerformance[] = [];

  async findAll(): Promise<StudentPerformance[]> {
    return simulateLatency([...this.records]);
  }

  async findByStudent(studentId: string): Promise<StudentPerformance[]> {
    return simulateLatency(this.records.filter((r) => r.studentId === studentId));
  }

  async findByStudentAndCourse(studentId: string, courseId: string): Promise<StudentPerformance | null> {
    return simulateLatency(
      this.records.find((r) => r.studentId === studentId && r.courseId === courseId) ?? null
    );
  }

  async upsert(record: StudentPerformance): Promise<StudentPerformance> {
    throw new Error("Not implemented — PART 2: performance");
  }

  async remove(studentId: string, courseId: string): Promise<void> {
    throw new Error("Not implemented — PART 2: performance");
  }
}

export const performanceRepository = new PerformanceRepository();
