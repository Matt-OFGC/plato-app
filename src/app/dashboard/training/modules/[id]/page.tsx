import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import TrainingModuleViewer from "./components/TrainingModuleViewer";

export const dynamic = "force-dynamic";

export default async function TrainingModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login?redirect=/dashboard/training");
  }

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const moduleId = parseInt(id);

  if (isNaN(moduleId)) {
    redirect("/dashboard/training");
  }

  // Get module with content
  const module = await prisma.trainingModule.findUnique({
    where: { id: moduleId },
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
  });

  if (!module || (module.companyId !== companyId && !module.isTemplate)) {
    redirect("/dashboard/training");
  }

  // Get training records for current user
  const membership = await prisma.membership.findUnique({
    where: {
      userId_companyId: {
        userId: user.id,
        companyId,
      },
    },
  });

  let trainingRecord = null;
  if (membership) {
    trainingRecord = await prisma.trainingRecord.findUnique({
      where: {
        membershipId_moduleId: {
          membershipId: membership.id,
          moduleId: module.id,
        },
      },
    });
  }

  return (
    <TrainingModuleViewer
      module={module}
      trainingRecord={trainingRecord}
      companyId={companyId}
      currentUserId={user.id}
    />
  );
}

