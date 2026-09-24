import { PageHeader } from "@/components/layout/PageHeader";
import { reportDefinitions } from "@/lib/mock/reports.mock";
import { ReportsGrid } from "@/components/modules/ReportsGrid";

export default function AdminReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" description="Generate reports across courses, batches and students." />
      <ReportsGrid reports={reportDefinitions} />
    </div>
  );
}
