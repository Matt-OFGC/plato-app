import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/permissions";
import { CompanyBillingDashboard } from "./CompanyBillingDashboard";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompanyBillingPage({ params }: Props) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) {
    redirect("/dashboard/companies");
  }

  // Verify user has access and can view billing
  const canViewBilling = await checkPermission(user.id, companyId, "billing:view");
  if (!canViewBilling) {
    redirect("/dashboard/companies");
  }

  // Get company and subscription info
  const [company, subscriptions] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        maxSeats: true,
      },
    }),
    // Get subscriptions for company members (if company-level billing exists)
    prisma.subscription.findMany({
      where: {
        user: {
          memberships: {
            some: {
              companyId,
              isActive: true,
            },
          },
        },
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
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!company) {
    redirect("/dashboard/companies");
  }

  return (
    <CompanyBillingDashboard
      company={company}
      subscriptions={subscriptions}
      currentUserId={user.id}
    />
  );
}
