import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { StudentsTable } from "@/components/modules/StudentsTable";
import { studentsService } from "@/services/students.service";
import type { StudentSummary } from "@/types/student";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  let students: StudentSummary[] = [];
  let loadError: string | null = null;

  try {
    students = await studentsService.listStudents();
  } catch (err) {
    console.error("[admin/students] load failed:", err instanceof Error ? err.message : err);
    loadError = "We couldn't load the students. Please try again.";
  }

  return (
    <div>
      <PageHeader
        title="Students"
        description="Manage and monitor all SPI trainees."
        actions={
          <Button size="sm">
            <UserPlus className="h-4 w-4" /> Add Student
          </Button>
        }
      />
      {loadError ? (
        <ErrorState title="We couldn't load the students" description={loadError} />
      ) : (
        <StudentsTable rows={students} />
      )}
    </div>
  );
}
