import type { UserStatus } from "./user";

/**
 * A student as the app presents it: public.students (code, name,
 * status) plus public.student_details (email, phone, organization,
 * designation — readable only by super_admin and the student
 * themselves). `id` is the student's profiles.id — the same id as
 * their auth user.
 */
export interface Student {
  id: string;
  /**
   * @deprecated Equal to `id` in the database (students.id =
   * profiles.id). Kept only for the mock student records
   * (src/lib/mock/students.mock.ts); remove when that module is wired.
   */
  userId: string;
  studentCode: string;
  fullName: string;
  email: string;
  phone?: string;
  organization?: string;
  designation?: string;
  /**
   * @deprecated Not stored — derived from batch_students in the
   * database. Kept only for the mock student records; remove when the
   * students module is wired.
   */
  enrolledBatchIds: string[];
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}
