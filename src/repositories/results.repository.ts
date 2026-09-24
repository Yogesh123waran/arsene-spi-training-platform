import type { TestResult } from "@/types";
import { simulateLatency, type Repository } from "./base.repository";

/**
 * PART 2 placeholder.
 *
 * Follows the same repository shape as students.repository.ts so the
 * results feature can be wired up later without touching any caller.
 * Swap the in-memory array below for real Supabase queries when the
 * results table is implemented.
 */
class ResultsRepository implements Repository<TestResult> {
  private records: TestResult[] = [];

  async findAll(): Promise<TestResult[]> {
    return simulateLatency([...this.records]);
  }

  async findById(id: string): Promise<TestResult | null> {
    return simulateLatency(
      this.records.find((r) => (r as { id: string }).id === id) ?? null
    );
  }

  async create(input: Omit<TestResult, "id">): Promise<TestResult> {
    throw new Error("Not implemented — PART 2: results");
  }

  async update(id: string, patch: Partial<TestResult>): Promise<TestResult> {
    throw new Error("Not implemented — PART 2: results");
  }

  async remove(id: string): Promise<void> {
    throw new Error("Not implemented — PART 2: results");
  }
}

export const resultsRepository = new ResultsRepository();
