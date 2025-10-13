import { redirect } from "next/navigation";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { AdminDashboard } from "@/components/AdminDashboard";

// Force dynamic rendering since this page uses cookies
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  try {
    const user = await getUserFromSession();
    if (!user) redirect("/login");
    
    // Check if user is admin
    const isAdmin = user.isAdmin;
    if (!isAdmin) {
      redirect("/dashboard");
    }
    
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminDashboard />
      </div>
    );
  } catch (error) {
    console.error("Admin page error:", error);
    redirect("/login");
  }
}
