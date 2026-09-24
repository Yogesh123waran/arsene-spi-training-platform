import { Layers, GraduationCap, CalendarDays, LineChart } from "lucide-react";
import { PortalDashboard } from "@/components/layout/PortalDashboard";
import { authService } from "@/services/auth.service";
import { trainerKpis } from "@/lib/mock/dashboard.mock";

const kpiIcons = [Layers, GraduationCap, CalendarDays, LineChart];

export default async function TrainerDashboardPage() {
  const user = await authService.getCurrentUser();
  return (
    <PortalDashboard
      role="trainer"
      welcomeName={user?.fullName?.split(" ")[0] ?? "Trainer"}
      kpis={trainerKpis}
      kpiIcons={kpiIcons}
    />
  );
}
