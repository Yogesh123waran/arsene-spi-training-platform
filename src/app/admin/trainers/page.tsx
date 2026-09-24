import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { trainerTableRows } from "@/lib/mock/trainers-table.mock";
import { TrainersTable } from "./TrainersTable";

export default function AdminTrainersPage() {
  return (
    <div>
      <PageHeader
        title="Trainers"
        description="Manage trainer profiles, specializations and assignments."
        actions={
          <Button size="sm">
            <UserPlus className="h-4 w-4" /> Add Trainer
          </Button>
        }
      />
      <TrainersTable rows={trainerTableRows} />
    </div>
  );
}
