import { PageHeader } from "@/components/layout/PageHeader";
import { attendanceTableRows } from "@/lib/mock/attendance-table.mock";
import { AttendanceView } from "@/components/modules/AttendanceView";

export default function AdminAttendancePage() {
  return (
    <div>
      <PageHeader title="Attendance" description="Mark and review attendance for each class." />
      <AttendanceView rows={attendanceTableRows} />
    </div>
  );
}
