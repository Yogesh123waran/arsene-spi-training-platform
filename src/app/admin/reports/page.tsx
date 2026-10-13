import { PageHeader } from "@/components/layout/PageHeader";
import { ReportsUnavailable } from "@/components/modules/ReportsUnavailable";

export default function AdminReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" description="Reports across courses, batches and students." />
      <ReportsUnavailable portal="admin" />
    </div>
  );
}
