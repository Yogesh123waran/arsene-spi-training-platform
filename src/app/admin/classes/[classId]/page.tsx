import { notFound } from "next/navigation";
import { ClassDetailView } from "@/components/modules/ClassDetailView";
import { classesService } from "@/services/classes.service";

export const dynamic = "force-dynamic";

export default async function AdminClassDetailPage({ params }: { params: { classId: string } }) {
  // Returns null when the class doesn't exist OR is outside this
  // user's scope — both surface as a 404 so the two are
  // indistinguishable to the caller.
  const trainingClass = await classesService.getClass(params.classId);
  if (!trainingClass) notFound();

  return <ClassDetailView trainingClass={trainingClass} basePath="/admin/classes" canManage />;
}
