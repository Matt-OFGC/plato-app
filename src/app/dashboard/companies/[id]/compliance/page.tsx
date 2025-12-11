import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasCompanyAccess } from "@/lib/current";
import { ComplianceDashboard } from "./ComplianceDashboard";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompanyCompliancePage({ params }: Props) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { id } = await params;
  const companyId = parseInt(id);

  if (isNaN(companyId)) {
    redirect("/dashboard/companies");
  }

  // Verify user has access
  const hasAccess = await hasCompanyAccess(user.id, companyId);
  if (!hasAccess) {
    redirect("/dashboard/companies");
  }

  // Get company and compliance-related data
  const [company, recipes, ingredients, memberships] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        country: true,
        businessType: true,
      },
    }),
    prisma.recipe.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        allergens: true,
      },
    }),
    prisma.ingredient.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        allergens: true,
      },
    }),
    prisma.membership.findMany({
      where: { companyId, isActive: true },
      select: {
        id: true,
        role: true,
      },
    }),
  ]);

  if (!company) {
    redirect("/dashboard/companies");
  }

  return (
    <ComplianceDashboard
      company={company}
      recipes={recipes}
      ingredients={ingredients}
      memberships={memberships}
    />
  );
}
