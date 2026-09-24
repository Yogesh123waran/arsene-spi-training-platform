import type { Student } from "@/types";
import { mockStudents } from "@/lib/mock/students.mock";
import { simulateLatency, type Repository } from "./base.repository";
// import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * PART 1 reference implementation of the repository pattern.
 *
 * Backed by in-memory mock data for now. When Supabase is connected,
 * replace the method bodies with queries against a `students` table
 * (see the commented import above) — the exported shape and every
 * caller in services/features stays identical.
 */
class StudentsRepository implements Repository<Student> {
  private records: Student[] = [...mockStudents];

  async findAll(): Promise<Student[]> {
    return simulateLatency([...this.records]);
  }

  async findById(id: string): Promise<Student | null> {
    return simulateLatency(this.records.find((s) => s.id === id) ?? null);
  }

  async create(input: Omit<Student, "id">): Promise<Student> {
    const created: Student = { ...input, id: `std_${Date.now()}` };
    this.records = [...this.records, created];
    return simulateLatency(created);
  }

  async update(id: string, patch: Partial<Student>): Promise<Student> {
    const existing = this.records.find((s) => s.id === id);
    if (!existing) throw new Error(`Student ${id} not found`);
    const updated = { ...existing, ...patch };
    this.records = this.records.map((s) => (s.id === id ? updated : s));
    return simulateLatency(updated);
  }

  async remove(id: string): Promise<void> {
    this.records = this.records.filter((s) => s.id !== id);
    return simulateLatency(undefined);
  }
}

export const studentsRepository = new StudentsRepository();
