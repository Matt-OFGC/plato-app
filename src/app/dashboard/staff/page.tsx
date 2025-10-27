import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import StaffPageClient from "./StaffPageClient";

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  try {
    const user = await getUserFromSession();
    if (!user) redirect("/login");
    
    const { companyId } = await getCurrentUserAndCompany();
    
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: companyId || 0,
        },
      },
    });
    
    if (!membership) {
      redirect("/dashboard");
    }
    
    // Get team members for selection
    const members = await prisma.membership.findMany({
      where: { 
        companyId: companyId || 0,
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
    
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-2">Manage schedules, track time, and handle leave requests</p>
        </div>

        <StaffPageClient 
          companyId={companyId!}
          currentUserRole={membership.role}
          members={members}
        />
      </div>
    );
  } catch (error) {
    console.error("Staff page error:", error);
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Staff Page</h1>
          <p className="text-gray-600">{error instanceof Error ? error.message : "Unknown error"}</p>
        </div>
      </div>
    );
  }
}
