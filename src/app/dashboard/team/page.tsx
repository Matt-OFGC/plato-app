import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { TeamManager } from "@/components/TeamManager";
import { SeatManager } from "@/components/SeatManager";

export default async function TeamPage() {
  try {
    const user = await getUserFromSession();
    if (!user) redirect("/login");
    
    const { companyId } = await getCurrentUserAndCompany();
    
    // Check if user has a company
    if (!companyId) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Company Found</h1>
            <p className="text-gray-600">You need to be part of a company to access team management.</p>
            <p className="text-gray-500 text-sm mt-2">Contact your administrator to be added to a company.</p>
          </div>
        </div>
      );
    }
    
    // Get user's membership and role
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: companyId,
        },
      },
    });

    if (!membership || !membership.isActive) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have access to team management.</p>
            <p className="text-gray-500 text-sm mt-2">Your membership may be inactive or you don't have the required permissions.</p>
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
          companyId={companyId} 
          canManageBilling={membership.role === "OWNER"} 
        />
        
        {/* Team Management */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <TeamManager companyId={companyId} currentUserRole={membership.role} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Team page error:", error);
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Team Page</h1>
          <p className="text-gray-600">There was an error loading the team management page.</p>
          <p className="text-gray-500 text-sm mt-2">Please try refreshing the page or contact support if the issue persists.</p>
          <div className="mt-4">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
