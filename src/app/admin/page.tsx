import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { AdminDashboard, AdminDashboardSkeleton, DASHBOARD_TITLE } from "@/components/dashboard/AdminDashboard";
import { adminDashboardService } from "@/services/dashboard.service";

// Per-user data read from the session: never cached or shared between users.
export const dynamic = "force-dynamic";

async function DashboardContent() {
  let data;
  try {
    data = await adminDashboardService.getDashboard();
  } catch (err) {
    console.error("[admin/dashboard] load failed:", err instanceof Error ? err.name : "unknown error");
    return (
      <div>
        <PageHeader title={DASHBOARD_TITLE} />
        <ErrorState title="We couldn't load the dashboard" description="Please try again." />
      </div>
    );
  }
  return <AdminDashboard data={data} />;
}

/**
 * Super Admin dashboard. Access: middleware + the admin layout's RoleGuard,
 * then the dashboard service (Super Admin only) and RLS on every read.
 * The skeleton is this page's own Suspense fallback, so other /admin pages
 * keep their own loading states.
 */
export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
