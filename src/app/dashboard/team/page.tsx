import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { TeamManager } from "@/components/TeamManager";
import { SeatManager } from "@/components/SeatManager";

export default async function TeamPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");
  
  const { companyId } = await getCurrentUserAndCompany();
  
  // Get user's membership and role
  const membership = await prisma.membership.findUnique({
    where: {
      userId_companyId: {
        userId: user.id,
        companyId: companyId || 0,
      },
    },
  });

  if (!membership) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have access to team management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <p className="text-gray-600 mt-2">Manage your team members and their permissions</p>
      </div>

      {/* Seat Management */}
      <SeatManager 
        companyId={companyId!} 
        canManageBilling={membership.role === "OWNER"} 
      />
      
      {/* Team Management */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <TeamManager companyId={companyId!} currentUserRole={membership.role} />
      </div>
    </div>
  );
}
