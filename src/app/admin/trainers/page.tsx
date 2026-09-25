import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { trainersService } from "@/services/trainers.service";
import type { TrainerSummary } from "@/types/trainer";
import { TrainersTable } from "./TrainersTable";

export const dynamic = "force-dynamic";

export default async function AdminTrainersPage() {
  let trainers: TrainerSummary[] = [];
  let loadError: string | null = null;

  try {
    trainers = await trainersService.listTrainers();
  } catch (err) {
    console.error("[admin/trainers] load failed:", err instanceof Error ? err.message : err);
    loadError = "We couldn't load the trainers. Please try again.";
  }

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
      {loadError ? (
        <ErrorState title="We couldn't load the trainers" description={loadError} />
      ) : (
        <TrainersTable rows={trainers} />
      )}
    </div>
  );
}
