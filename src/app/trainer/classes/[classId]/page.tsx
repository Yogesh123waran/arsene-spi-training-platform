import { notFound } from "next/navigation";
import { ClassDetailView } from "@/components/modules/ClassDetailView";
import { classesService } from "@/services/classes.service";

export const dynamic = "force-dynamic";

export default async function TrainerClassDetailPage({ params }: { params: { classId: string } }) {
  // Scoped to the signed-in trainer server-side — another trainer's
  // class id yields null, then a 404.
  const trainingClass = await classesService.getClass(params.classId);
  if (!trainingClass) notFound();

  return <ClassDetailView trainingClass={trainingClass} basePath="/trainer/classes" canManage />;
}
