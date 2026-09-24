import { PageHeader } from "@/components/layout/PageHeader";
import { ReportsGrid } from "@/components/modules/ReportsGrid";
import { reportDefinitions } from "@/lib/mock/reports.mock";

const TRAINER_REPORT_IDS = ["rep_students", "rep_attendance", "rep_tests"];

export default function TrainerReportsPage() {
  const reports = reportDefinitions.filter((r) => TRAINER_REPORT_IDS.includes(r.id));

  return (
    <div>
      <PageHeader title="Reports" description="Generate reports for your assigned courses and batches." />
      <ReportsGrid reports={reports} />
    </div>
  );
}
