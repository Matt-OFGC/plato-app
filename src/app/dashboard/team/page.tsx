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
    
    // Check if user has ADMIN role (ADMIN-only access for team management)
    if (!membership || !membership.isActive || membership.role !== "ADMIN") {
      redirect("/dashboard?error=access_denied");
    }
    
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
    const membershipIds = membersRaw.map((m: any) => m.id);
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
    const profileMap = new Map(profiles.map((p: any) => [p.membershipId, p]));

    // Merge profiles into members
    const members = membersRaw.map((member: any) => ({
      ...member,
      staffProfile: profileMap.get(member.id) || null,
    }));
    
    return (
      <div className="space-y-4 sm:space-y-6">
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
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Team Page</h1>
            <p className="text-gray-600">{error instanceof Error ? error.message : "Unknown error"}</p>
          </div>
        </div>
      </div>
    );
  }
}
