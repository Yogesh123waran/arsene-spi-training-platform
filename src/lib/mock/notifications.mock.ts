/** PART 3 UI-only mock rows for the Notifications center. */
export interface NotificationRow {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export const notificationRows: NotificationRow[] = [
  { id: "ntf_001", type: "success", title: "New certificate issued", message: "Priya Nair completed Instrumentation Basics.", date: "2026-05-26T10:00:00.000Z", read: false },
  { id: "ntf_002", type: "info", title: "New student registered", message: "Alex Johnson signed up for Batch A.", date: "2026-05-26T08:00:00.000Z", read: false },
  { id: "ntf_003", type: "warning", title: "Low attendance alert", message: "Sneha Iyer has fallen below 75% attendance.", date: "2026-05-25T14:00:00.000Z", read: false },
  { id: "ntf_004", type: "info", title: "Test scheduled", message: "Process Safety - Final Exam scheduled for 27 May.", date: "2026-05-24T09:00:00.000Z", read: true },
  { id: "ntf_005", type: "error", title: "Batch capacity exceeded", message: "Batch A has reached its maximum seat limit.", date: "2026-05-22T11:00:00.000Z", read: true },
];
