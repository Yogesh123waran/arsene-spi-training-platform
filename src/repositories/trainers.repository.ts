import type { Trainer } from "@/types";
import { simulateLatency, type Repository } from "./base.repository";

/**
 * PART 2 placeholder.
 *
 * Follows the same repository shape as students.repository.ts so the
 * trainers feature can be wired up later without touching any caller.
 * Swap the in-memory array below for real Supabase queries when the
 * trainers table is implemented.
 */
class TrainersRepository implements Repository<Trainer> {
  private records: Trainer[] = [];

  async findAll(): Promise<Trainer[]> {
    return simulateLatency([...this.records]);
  }

  async findById(id: string): Promise<Trainer | null> {
    return simulateLatency(
      this.records.find((r) => (r as { id: string }).id === id) ?? null
    );
  }

  async create(input: Omit<Trainer, "id">): Promise<Trainer> {
    throw new Error("Not implemented — PART 2: trainers");
  }

  async update(id: string, patch: Partial<Trainer>): Promise<Trainer> {
    throw new Error("Not implemented — PART 2: trainers");
  }

  async remove(id: string): Promise<void> {
    throw new Error("Not implemented — PART 2: trainers");
  }
}

export const trainersRepository = new TrainersRepository();
