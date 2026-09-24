import type { Student } from "@/types";
import { studentsRepository } from "@/repositories/students.repository";

/**
 * Service layer — owns business rules and orchestrates one or more
 * repositories. Server Components / route handlers / server actions
 * call services; they should never import a repository directly.
 *
 * This is the PART 1 reference implementation; other feature
 * services follow the same shape once their module is built.
 */
export const studentsService = {
  async listStudents(): Promise<Student[]> {
    return studentsRepository.findAll();
  },

  async getStudent(id: string): Promise<Student | null> {
    return studentsRepository.findById(id);
  },

  async enrollStudent(input: Omit<Student, "id">): Promise<Student> {
    // Business rule example: normalize email before persisting.
    return studentsRepository.create({
      ...input,
      email: input.email.trim().toLowerCase(),
    });
  },

  async updateStudent(id: string, patch: Partial<Student>): Promise<Student> {
    return studentsRepository.update(id, patch);
  },

  async removeStudent(id: string): Promise<void> {
    return studentsRepository.remove(id);
  },
};
