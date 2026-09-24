import { ClipboardCheck, FileCheck2, LineChart, BookOpen } from "lucide-react";
import { PortalDashboard } from "@/components/layout/PortalDashboard";
import { authService } from "@/services/auth.service";
import { studentKpis } from "@/lib/mock/dashboard.mock";

const kpiIcons = [ClipboardCheck, FileCheck2, LineChart, BookOpen];

export default async function StudentDashboardPage() {
  const user = await authService.getCurrentUser();
  return (
    <PortalDashboard
      role="student"
      welcomeName={user?.fullName?.split(" ")[0] ?? "Student"}
      kpis={studentKpis}
      kpiIcons={kpiIcons}
    />
  );
}
