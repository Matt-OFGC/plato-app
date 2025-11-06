import { redirect } from "next/navigation";

// Legacy route - redirect to new Team member profile page
export default async function StaffProfileRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/team/${id}`);
}
