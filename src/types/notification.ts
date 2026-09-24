export type NotificationType = "info" | "success" | "warning" | "error";

export type NotificationAudience = "admin" | "trainer" | "student" | "all";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  audience: NotificationAudience;
  read: boolean;
  createdAt: string;
  link?: string;
}
