import { PageHeader } from "@/components/layout/PageHeader";
import { ResultsTable } from "@/components/modules/ResultsTable";
import { studentResultRows } from "@/lib/mock/results.mock";

export default function StudentResultsPage() {
  return (
    <div>
      <PageHeader title="Results" description="Review your test results, scores and pass/fail status." />
      <ResultsTable rows={studentResultRows} />
    </div>
  );
}
