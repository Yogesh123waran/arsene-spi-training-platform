import { PageHeader } from "@/components/layout/PageHeader";
import { PerformanceView } from "@/components/modules/PerformanceView";

export default function StudentPerformancePage() {
  return (
    <div>
      <PageHeader title="Performance" description="Track your attendance, test scores and course progress." />
      <PerformanceView />
    </div>
  );
}
