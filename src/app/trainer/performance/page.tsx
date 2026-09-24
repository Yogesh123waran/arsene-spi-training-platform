import { PageHeader } from "@/components/layout/PageHeader";
import { PerformanceView } from "@/components/modules/PerformanceView";

export default function TrainerPerformancePage() {
  return (
    <div>
      <PageHeader title="Performance" description="Track your students' performance across attendance and tests." />
      <PerformanceView />
    </div>
  );
}
