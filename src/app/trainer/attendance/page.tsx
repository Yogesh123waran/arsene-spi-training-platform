import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { AttendanceView } from "@/components/modules/AttendanceView";
import { getAttendanceForBatches } from "@/lib/mock/attendance-table.mock";

const TRAINER_BATCHES = ["Batch A"];

export default function TrainerAttendancePage() {
  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Mark and review attendance for your classes."
        actions={
          <Button size="sm">
            <ClipboardCheck className="h-4 w-4" /> Mark Attendance
          </Button>
        }
      />
      <AttendanceView rows={getAttendanceForBatches(TRAINER_BATCHES)} />
    </div>
  );
}
