import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { TestsGrid } from "@/components/modules/TestsGrid";
import { getTestsForCourses } from "@/lib/mock/tests.mock";

const TRAINER_COURSES = ["Instrumentation Basics", "P&ID Fundamentals"];

export default function TrainerTestsPage() {
  return (
    <div>
      <PageHeader
        title="Tests"
        description="Create and manage tests for your assigned courses."
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" /> Create Test
          </Button>
        }
      />
      <TestsGrid tests={getTestsForCourses(TRAINER_COURSES)} />
    </div>
  );
}
