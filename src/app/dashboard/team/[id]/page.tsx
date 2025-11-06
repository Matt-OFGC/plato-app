import { redirect } from "next/navigation";
import { getUserFromSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import StaffProfileClient from "../../staff/[id]/components/StaffProfileClient";

export const dynamic = "force-dynamic";

export default async function TeamMemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login?redirect=/dashboard/team");
  }

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const membershipId = parseInt(id);

  if (isNaN(membershipId)) {
    redirect("/dashboard/team");
  }

  // Get membership
  const membership = await prisma.membership.findUnique({
    where: {
      id: membershipId,
      companyId,
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
  });

  if (!membership) {
    redirect("/dashboard/team");
  }

  // Get staff profile
  const profile = await prisma.staffProfile.findUnique({
    where: { membershipId },
  });

  // Get related data
  const [trainingRecords, cleaningJobs, productionAssignments, timesheets] =
    await Promise.all([
      prisma.trainingRecord.findMany({
        where: { membershipId },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              refreshFrequencyDays: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.cleaningJob.findMany({
        where: { membershipId },
        include: {
          productionPlan: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { dueDate: "asc" },
        take: 20,
      }),
      prisma.productionJobAssignment.findMany({
        where: { membershipId },
        include: {
          productionItem: {
            include: {
              recipe: {
                select: {
                  id: true,
                  name: true,
                },
              },
              plan: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { assignedDate: "desc" },
        take: 20,
      }),
      prisma.timesheet.findMany({
        where: { membershipId },
        orderBy: { clockInAt: "desc" },
        take: 10,
      }),
    ]);

  return (
    <StaffProfileClient
      membership={membership}
      profile={profile}
      trainingRecords={trainingRecords}
      cleaningJobs={cleaningJobs}
      productionAssignments={productionAssignments}
      timesheets={timesheets}
      currentUserId={user.id}
    />
  );
}

