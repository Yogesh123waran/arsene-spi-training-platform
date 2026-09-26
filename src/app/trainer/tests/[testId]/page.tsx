import { notFound } from "next/navigation";
import { ErrorState } from "@/components/ui/ErrorState";
import { TestDetailView } from "@/components/modules/TestDetailView";
import { testsService } from "@/services/tests.service";
import type { TestDetail } from "@/types/test";

export const dynamic = "force-dynamic";

export default async function TrainerTestDetailPage({ params }: { params: { testId: string } }) {
  let test: TestDetail | null = null;
  let loadError: string | null = null;

  try {
    // RLS limits this to tests of the trainer's batches/classes; the
    // service decides whether they may manage it (current trainer only).
    test = await testsService.getTestDetail(params.testId);
  } catch (err) {
    console.error("[trainer/tests/detail] load failed:", err instanceof Error ? err.message : err);
    loadError = "We couldn't load this test. Please try again.";
  }

  if (loadError) return <ErrorState title="We couldn't load this test" description={loadError} />;
  if (!test) notFound();

  return <TestDetailView test={test} basePath="/trainer/tests" />;
}
