import type { Course } from "@/types";
import { simulateLatency, type Repository } from "./base.repository";

/**
 * PART 2 placeholder.
 *
 * Follows the same repository shape as students.repository.ts so the
 * courses feature can be wired up later without touching any caller.
 * Swap the in-memory array below for real Supabase queries when the
 * courses table is implemented.
 */
class CoursesRepository implements Repository<Course> {
  private records: Course[] = [];

  async findAll(): Promise<Course[]> {
    return simulateLatency([...this.records]);
  }

  async findById(id: string): Promise<Course | null> {
    return simulateLatency(
      this.records.find((r) => (r as { id: string }).id === id) ?? null
    );
  }

  async create(input: Omit<Course, "id">): Promise<Course> {
    throw new Error("Not implemented — PART 2: courses");
  }

  async update(id: string, patch: Partial<Course>): Promise<Course> {
    throw new Error("Not implemented — PART 2: courses");
  }

  async remove(id: string): Promise<void> {
    throw new Error("Not implemented — PART 2: courses");
  }
}

export const coursesRepository = new CoursesRepository();
