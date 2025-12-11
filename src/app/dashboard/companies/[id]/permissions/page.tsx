import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasCompanyAccess } from "@/lib/current";
import { checkPermission } from "@/lib/permissions";
import { PermissionsManagement } from "./PermissionsManagement";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompanyPermissionsPage({ params }: Props) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) {
    redirect("/dashboard/companies");
  }

  // Verify user has permission to manage permissions
  const canManage = await checkPermission(user.id, companyId, "settings:edit");
  if (!canManage) {
    redirect("/dashboard/companies");
  }

  // Get all memberships with roles
  const memberships = await prisma.membership.findMany({
    where: {
      companyId,
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Get current user's membership
  const currentMembership = memberships.find(m => m.userId === user.id);

  return (
    <PermissionsManagement
      companyId={companyId}
      memberships={memberships}
      currentUserRole={currentMembership?.role || "EMPLOYEE"}
      currentUserId={user.id}
    />
  );
}
