import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Cleaning jobs removed - redirect to team page
export default async function CleaningJobsPage() {
  redirect("/dashboard/team");
}

