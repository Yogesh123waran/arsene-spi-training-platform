import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { authService } from "@/services/auth.service";

export default async function AdminDashboardPage() {
  const user = await authService.getCurrentUser();
  return <AdminDashboard welcomeName={user?.fullName?.split(" ")[0] ?? "Admin"} />;
}
