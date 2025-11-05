import { TaskDetailClient } from "./TaskDetailClient";

export const dynamic = "force-dynamic";

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <TaskDetailClient params={params} />;
}

