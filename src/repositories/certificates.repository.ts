import type { Certificate } from "@/types";
import { simulateLatency, type Repository } from "./base.repository";

/**
 * PART 2 placeholder.
 *
 * Follows the same repository shape as students.repository.ts so the
 * certificates feature can be wired up later without touching any caller.
 * Swap the in-memory array below for real Supabase queries when the
 * certificates table is implemented.
 */
class CertificatesRepository implements Repository<Certificate> {
  private records: Certificate[] = [];

  async findAll(): Promise<Certificate[]> {
    return simulateLatency([...this.records]);
  }

  async findById(id: string): Promise<Certificate | null> {
    return simulateLatency(
      this.records.find((r) => (r as { id: string }).id === id) ?? null
    );
  }

  async create(input: Omit<Certificate, "id">): Promise<Certificate> {
    throw new Error("Not implemented — PART 2: certificates");
  }

  async update(id: string, patch: Partial<Certificate>): Promise<Certificate> {
    throw new Error("Not implemented — PART 2: certificates");
  }

  async remove(id: string): Promise<void> {
    throw new Error("Not implemented — PART 2: certificates");
  }
}

export const certificatesRepository = new CertificatesRepository();
