import { redirect } from "next/navigation";
import { getUserFromSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { checkPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import CleaningJobsClient from "../../staff/cleaning/components/CleaningJobsClient";

export const dynamic = "force-dynamic";

export default async function CleaningJobsPage() {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login?redirect=/dashboard/team/cleaning");
  }

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) {
    redirect("/dashboard");
  }

  // Check permission
  const canView = await checkPermission(user.id, companyId, "cleaning:view");
  if (!canView) {
    redirect("/dashboard");
  }

  // Get cleaning jobs
  const jobs = await prisma.cleaningJob.findMany({
    where: { companyId },
    include: {
      membership: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      productionPlan: {
        select: {
          id: true,
          name: true,
        },
      },
      completedByUser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  // Get staff members for assignment
  const members = await prisma.membership.findMany({
    where: {
      companyId,
      isActive: true,
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
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <CleaningJobsClient
      jobs={jobs}
      members={members}
      companyId={companyId}
      currentUserId={user.id}
    />
  );
}

