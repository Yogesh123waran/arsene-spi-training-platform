import { PageHeader } from "@/components/layout/PageHeader";
import { ReportsUnavailable } from "@/components/modules/ReportsUnavailable";

export default function TrainerReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" description="Reports for your assigned courses and batches." />
      <ReportsUnavailable portal="trainer" />
    </div>
  );
}
