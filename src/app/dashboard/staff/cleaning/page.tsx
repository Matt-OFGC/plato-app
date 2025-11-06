import { redirect } from "next/navigation";

// Legacy route - redirect to new Cleaning Jobs page
export default function CleaningJobsRedirect() {
  redirect("/dashboard/team/cleaning");
}
