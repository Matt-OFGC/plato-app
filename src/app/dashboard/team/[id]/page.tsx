import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Staff profiles removed - redirect to team page
export default async function TeamMemberProfilePage() {
  redirect("/dashboard/team");
}

