import { PageHeader } from "@/components/layout/PageHeader";
import { StudentsTable } from "@/components/modules/StudentsTable";
import { getStudentsForBatches } from "@/lib/mock/students-table.mock";

// Demo scope: in a later part this comes from the signed-in trainer's assigned batches.
const TRAINER_BATCHES = ["Batch A"];

export default function TrainerStudentsPage() {
  return (
    <div>
      <PageHeader title="My Students" description="Students enrolled in your assigned batches." />
      <StudentsTable rows={getStudentsForBatches(TRAINER_BATCHES)} />
    </div>
  );
}
