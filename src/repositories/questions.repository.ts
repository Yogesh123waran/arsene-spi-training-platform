import type { Question } from "@/types";
import { simulateLatency, type Repository } from "./base.repository";

/**
 * PART 2 placeholder.
 *
 * Follows the same repository shape as students.repository.ts so the
 * questions feature can be wired up later without touching any caller.
 * Swap the in-memory array below for real Supabase queries when the
 * questions table is implemented.
 */
class QuestionsRepository implements Repository<Question> {
  private records: Question[] = [];

  async findAll(): Promise<Question[]> {
    return simulateLatency([...this.records]);
  }

  async findById(id: string): Promise<Question | null> {
    return simulateLatency(
      this.records.find((r) => (r as { id: string }).id === id) ?? null
    );
  }

  async create(input: Omit<Question, "id">): Promise<Question> {
    throw new Error("Not implemented — PART 2: questions");
  }

  async update(id: string, patch: Partial<Question>): Promise<Question> {
    throw new Error("Not implemented — PART 2: questions");
  }

  async remove(id: string): Promise<void> {
    throw new Error("Not implemented — PART 2: questions");
  }
}

export const questionsRepository = new QuestionsRepository();
