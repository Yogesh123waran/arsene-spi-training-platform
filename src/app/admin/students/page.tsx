import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { studentTableRows } from "@/lib/mock/students-table.mock";
import { StudentsTable } from "@/components/modules/StudentsTable";

export default function AdminStudentsPage() {
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
      <StudentsTable rows={studentTableRows} />
    </div>
  );
}
