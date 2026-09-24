import type { Batch } from "@/types";
import { simulateLatency, type Repository } from "./base.repository";

/**
 * PART 2 placeholder.
 *
 * Follows the same repository shape as students.repository.ts so the
 * batches feature can be wired up later without touching any caller.
 * Swap the in-memory array below for real Supabase queries when the
 * batches table is implemented.
 */
class BatchesRepository implements Repository<Batch> {
  private records: Batch[] = [];

  async findAll(): Promise<Batch[]> {
    return simulateLatency([...this.records]);
  }

  async findById(id: string): Promise<Batch | null> {
    return simulateLatency(
      this.records.find((r) => (r as { id: string }).id === id) ?? null
    );
  }

  async create(input: Omit<Batch, "id">): Promise<Batch> {
    throw new Error("Not implemented — PART 2: batches");
  }

  async update(id: string, patch: Partial<Batch>): Promise<Batch> {
    throw new Error("Not implemented — PART 2: batches");
  }

  async remove(id: string): Promise<void> {
    throw new Error("Not implemented — PART 2: batches");
  }
}

export const batchesRepository = new BatchesRepository();
