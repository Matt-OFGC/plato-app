import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CompanyDetailView } from "./CompanyDetailView";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: Props) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) {
    redirect("/dashboard/companies");
  }

  // Verify user has access
  const { hasCompanyAccess } = await import("@/lib/current");
  const hasAccess = await hasCompanyAccess(user.id, companyId);
  
  if (!hasAccess) {
    redirect("/dashboard/companies");
  }

  // Get company details
  const [company, membership, healthMetrics] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            memberships: {
              where: { isActive: true },
            },
            recipes: true,
            ingredients: true,
          },
        },
      },
    }),
    prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId,
        },
      },
    }),
    import("@/lib/company-health")
      .then(m => m.calculateCompanyHealth(companyId))
      .catch(() => null),
  ]);

  if (!company || !membership) {
    redirect("/dashboard/companies");
  }

  return (
    <CompanyDetailView
      company={company}
      membership={membership}
      healthMetrics={healthMetrics}
    />
  );
}
