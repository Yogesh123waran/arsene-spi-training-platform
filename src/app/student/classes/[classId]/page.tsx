import { notFound } from "next/navigation";
import { ClassDetailView } from "@/components/modules/ClassDetailView";
import { classesService } from "@/services/classes.service";

export const dynamic = "force-dynamic";

export default async function StudentClassDetailPage({ params }: { params: { classId: string } }) {
  // Scoped to the student's own batch server-side — requesting
  // another batch's class id yields null, then a 404.
  const trainingClass = await classesService.getClass(params.classId);
  if (!trainingClass) notFound();

  return <ClassDetailView trainingClass={trainingClass} basePath="/student/classes" />;
}
