import { redirect } from "next/navigation";

// Legacy route - redirect to new Team page
export default function StaffPageRedirect() {
  redirect("/dashboard/team");
}
