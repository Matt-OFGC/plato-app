import { redirect } from "next/navigation";
import { getUserFromSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { checkPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import TrainingDashboardClient from "./components/TrainingDashboardClient";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login?redirect=/dashboard/training");
  }

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

  // Get modules
  const modules = await prisma.trainingModule.findMany({
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

  return <TrainingDashboardClient modules={modules} companyId={companyId} />;
}

