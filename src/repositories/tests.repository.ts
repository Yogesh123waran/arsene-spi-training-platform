import type { Test } from "@/types";
import { simulateLatency, type Repository } from "./base.repository";

/**
 * PART 2 placeholder.
 *
 * Follows the same repository shape as students.repository.ts so the
 * tests feature can be wired up later without touching any caller.
 * Swap the in-memory array below for real Supabase queries when the
 * tests table is implemented.
 */
class TestsRepository implements Repository<Test> {
  private records: Test[] = [];

  async findAll(): Promise<Test[]> {
    return simulateLatency([...this.records]);
  }

  async findById(id: string): Promise<Test | null> {
    return simulateLatency(
      this.records.find((r) => (r as { id: string }).id === id) ?? null
    );
  }

  async create(input: Omit<Test, "id">): Promise<Test> {
    throw new Error("Not implemented — PART 2: tests");
  }

  async update(id: string, patch: Partial<Test>): Promise<Test> {
    throw new Error("Not implemented — PART 2: tests");
  }

  async remove(id: string): Promise<void> {
    throw new Error("Not implemented — PART 2: tests");
  }
}

export const testsRepository = new TestsRepository();
