import type { AppNotification } from "@/types";
import { simulateLatency, type Repository } from "./base.repository";

/**
 * PART 2 placeholder.
 *
 * Follows the same repository shape as students.repository.ts so the
 * notifications feature can be wired up later without touching any caller.
 * Swap the in-memory array below for real Supabase queries when the
 * notifications table is implemented.
 */
class NotificationsRepository implements Repository<AppNotification> {
  private records: AppNotification[] = [];

  async findAll(): Promise<AppNotification[]> {
    return simulateLatency([...this.records]);
  }

  async findById(id: string): Promise<AppNotification | null> {
    return simulateLatency(
      this.records.find((r) => (r as { id: string }).id === id) ?? null
    );
  }

  async create(input: Omit<AppNotification, "id">): Promise<AppNotification> {
    throw new Error("Not implemented — PART 2: notifications");
  }

  async update(id: string, patch: Partial<AppNotification>): Promise<AppNotification> {
    throw new Error("Not implemented — PART 2: notifications");
  }

  async remove(id: string): Promise<void> {
    throw new Error("Not implemented — PART 2: notifications");
  }
}

export const notificationsRepository = new NotificationsRepository();
