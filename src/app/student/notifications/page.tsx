import { PageHeader } from "@/components/layout/PageHeader";
import { NotificationsList } from "@/components/modules/NotificationsList";
import { notificationRows } from "@/lib/mock/notifications.mock";

export default function StudentNotificationsPage() {
  return (
    <div>
      <PageHeader title="Notifications" description="Stay up to date with your courses and tests." />
      <NotificationsList notifications={notificationRows} />
    </div>
  );
}
