import { PageHeader } from "@/components/layout/PageHeader";
import { AttendanceView } from "@/components/modules/AttendanceView";
import { getAttendanceForStudent } from "@/lib/mock/attendance-table.mock";

const STUDENT_NAME = "Arun Kumar";

export default function StudentAttendancePage() {
  return (
    <div>
      <PageHeader title="My Attendance" description="Your attendance record across all classes." />
      <AttendanceView rows={getAttendanceForStudent(STUDENT_NAME)} />
    </div>
  );
}
