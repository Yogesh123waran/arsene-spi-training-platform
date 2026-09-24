import { PageHeader } from "@/components/layout/PageHeader";
import { testCards } from "@/lib/mock/tests.mock";
import { StudentTestsView } from "./StudentTestsView";

export default function StudentTestsPage() {
  return (
    <div>
      <PageHeader title="Tests" description="Take your assigned tests and review your progress." />
      <StudentTestsView tests={testCards} />
    </div>
  );
}
