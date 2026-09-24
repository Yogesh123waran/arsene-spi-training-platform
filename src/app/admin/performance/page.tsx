import { PageHeader } from "@/components/layout/PageHeader";
import { PerformanceView } from "@/components/modules/PerformanceView";

export default function AdminPerformancePage() {
  return (
    <div>
      <PageHeader title="Performance" description="Track student performance across attendance and tests." />
      <PerformanceView />
    </div>
  );
}
