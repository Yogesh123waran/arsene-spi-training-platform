import { PageHeader } from "@/components/layout/PageHeader";
import { notificationRows } from "@/lib/mock/notifications.mock";
import { NotificationsList } from "@/components/modules/NotificationsList";

export default function AdminNotificationsPage() {
  return (
    <div>
      <PageHeader title="Notifications" description="Manage and review system notifications." />
      <NotificationsList notifications={notificationRows} />
    </div>
  );
}
