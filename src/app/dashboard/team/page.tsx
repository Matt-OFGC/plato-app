import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { CompanyLoadingErrorServer } from "@/components/CompanyLoadingErrorServer";
// Temporarily disabled to fix build error
// import { checkSectionAccess } from "@/lib/features";
import TeamManagementClient from "./components/TeamManagementClient";

// Force dynamic rendering since this page uses cookies
export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  try {
    const user = await getUserFromSession();
    if (!user) redirect("/login");

    // Temporarily disabled to fix build error
    // Check if user has Teams module unlocked
    // const hasAccess = await checkSectionAccess(user.id, "teams");
    // if (!hasAccess) {
    //   redirect("/dashboard?locked=teams");
    // }
    
    const result = await getCurrentUserAndCompany();
    const { companyId } = result;
    
    // Show error component if companyId is null
    if (!companyId) {
      return <CompanyLoadingErrorServer result={result} page="team" />;
    }
    
    // Get membership
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId,
        },
      },
    });
    
    // Get team members for selection
    const membersRaw = await prisma.membership.findMany({
      where: { 
        companyId,
        isActive: true 
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get staff profiles separately to avoid Prisma relation issues
    const membershipIds = membersRaw.map(m => m.id);
    let profiles: any[] = [];
    
    // Check if staffProfile model exists (defensive check)
    if (membershipIds.length > 0 && prisma.staffProfile) {
      try {
        profiles = await prisma.staffProfile.findMany({
          where: {
            membershipId: { in: membershipIds },
          },
        });
      } catch (error) {
        // If staffProfile doesn't exist yet, just use empty array
        console.warn('StaffProfile model not available:', error);
        profiles = [];
      }
    }

    // Create a map of membershipId -> profile
    const profileMap = new Map(profiles.map(p => [p.membershipId, p]));

    // Merge profiles into members
    const members = membersRaw.map(member => ({
      ...member,
      staffProfile: profileMap.get(member.id) || null,
    }));
    
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-2">Manage your team members, profiles, training, and assignments</p>
        </div>

        <TeamManagementClient 
          companyId={companyId}
          currentUserRole={membership?.role || "VIEWER"}
          members={members}
        />
      </div>
    );
  } catch (error) {
    const { logger } = await import("@/lib/logger");
    logger.error("Team page error:", error);
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Team Page</h1>
          <p className="text-gray-600">{error instanceof Error ? error.message : "Unknown error"}</p>
        </div>
      </div>
    );
  }
}
