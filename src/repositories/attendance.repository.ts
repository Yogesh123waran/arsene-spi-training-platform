import type { AttendanceRecord } from "@/types";
import { simulateLatency, type Repository } from "./base.repository";

/**
 * PART 2 placeholder.
 *
 * Follows the same repository shape as students.repository.ts so the
 * attendance feature can be wired up later without touching any caller.
 * Swap the in-memory array below for real Supabase queries when the
 * attendance table is implemented.
 */
class AttendanceRepository implements Repository<AttendanceRecord> {
  private records: AttendanceRecord[] = [];

  async findAll(): Promise<AttendanceRecord[]> {
    return simulateLatency([...this.records]);
  }

  async findById(id: string): Promise<AttendanceRecord | null> {
    return simulateLatency(
      this.records.find((r) => (r as { id: string }).id === id) ?? null
    );
  }

  async create(input: Omit<AttendanceRecord, "id">): Promise<AttendanceRecord> {
    throw new Error("Not implemented — PART 2: attendance");
  }

  async update(id: string, patch: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    throw new Error("Not implemented — PART 2: attendance");
  }

  async remove(id: string): Promise<void> {
    throw new Error("Not implemented — PART 2: attendance");
  }
}

export const attendanceRepository = new AttendanceRepository();
