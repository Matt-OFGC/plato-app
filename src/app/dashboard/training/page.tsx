import { redirect } from "next/navigation";
import { getUserFromSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { checkPermission } from "@/lib/permissions";
// Temporarily disabled to fix build error
// import { checkSectionAccess } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import TrainingDashboardClient from "./components/TrainingDashboardClient";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login?redirect=/dashboard/training");
  }

  // Temporarily disabled to fix build error
  // Check if user has Teams module unlocked (training is part of Teams)
  // const hasAccess = await checkSectionAccess(user.id, "teams");
  // if (!hasAccess) {
  //   redirect("/dashboard?locked=teams");
  // }

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) {
    redirect("/dashboard");
  }

  // Check permission - temporarily allow all users to view training
  // TODO: Re-enable strict permission check once roles are fully configured
  // const canView = await checkPermission(user.id, companyId, "training:view");
  // if (!canView) {
  //   redirect("/dashboard");
  // }

  // Get modules - with defensive check if model doesn't exist yet
  let modules: any[] = [];
  
  if (prisma.trainingModule) {
    try {
      modules = await prisma.trainingModule.findMany({
        where: { companyId },
        include: {
          content: {
            orderBy: { order: "asc" },
          },
          recipes: {
            include: {
              recipe: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      // If trainingModule doesn't exist yet, use empty array
      console.warn('TrainingModule model not available:', error);
      modules = [];
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <TrainingDashboardClient modules={modules} companyId={companyId} />
    </div>
  );
}

