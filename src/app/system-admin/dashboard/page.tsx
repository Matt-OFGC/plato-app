import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { SystemAdminDashboard } from "@/components/SystemAdminDashboard";

// Force dynamic rendering since this page uses cookies
export const dynamic = 'force-dynamic';

export default async function SystemAdminPage() {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      redirect("/system-admin/auth");
    }
    
    return (
      <div className="min-h-screen bg-gray-50">
        <SystemAdminDashboard session={session} />
      </div>
    );
  } catch (error) {
    console.error("System admin page error:", error);
    redirect("/system-admin/auth");
  }
}

