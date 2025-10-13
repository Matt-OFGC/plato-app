import { redirect } from "next/navigation";

// This page now redirects to the new secure admin system
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Redirect to the new secure admin login
  redirect("/system-admin/auth");
}
