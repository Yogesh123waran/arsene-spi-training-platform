import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { testCards } from "@/lib/mock/tests.mock";
import { TestsGrid } from "@/components/modules/TestsGrid";

export default function AdminTestsPage() {
  return (
    <div>
      <PageHeader
        title="Tests"
        description="Create, schedule and manage tests for a course or batch."
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4" /> Create Test
          </Button>
        }
      />
      <TestsGrid tests={testCards} />
    </div>
  );
}
