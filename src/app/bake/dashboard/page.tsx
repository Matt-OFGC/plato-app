import { redirect } from "next/navigation";

// Redirect /bake/dashboard to /bake (the main bake dashboard)
export default function BakeDashboardRedirect() {
  redirect("/bake");
}

