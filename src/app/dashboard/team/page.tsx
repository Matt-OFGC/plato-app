import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { SeatManager } from "@/components/SeatManager";
import { TeamManagerFixed } from "@/components/TeamManagerFixed";

export default async function TeamPage() {
  try {
    const user = await getUserFromSession();
    if (!user) redirect("/login");
    
    const { companyId } = await getCurrentUserAndCompany();
    
    // Test Prisma Membership query
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: companyId || 0,
        },
      },
    });
    
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-2">Manage your team members, permissions, and billing</p>
        </div>

        {/* Seat Management */}
        <SeatManager 
          companyId={companyId!} 
          canManageBilling={membership?.role === "OWNER"} 
        />

        {/* Team Management */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <TeamManagerFixed 
            companyId={companyId!} 
            currentUserRole={membership?.role || "VIEWER"} 
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Team page error:", error);
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error in Team Page</h1>
          <p className="text-gray-600">There was an error loading the team page.</p>
          <p className="text-gray-500 text-sm mt-2">Error: {error instanceof Error ? error.message : "Unknown error"}</p>
        </div>
      </div>
    );
  }
}
