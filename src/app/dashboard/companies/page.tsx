import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CompanyManagementDashboard } from "./CompanyManagementDashboard";

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  // Get all companies user belongs to
  const memberships = await prisma.membership.findMany({
    where: {
      userId: user.id,
      isActive: true,
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          businessType: true,
          country: true,
          createdAt: true,
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
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Get current company
  const { companyId } = await import("@/lib/current").then(m => m.getCurrentUserAndCompany()).catch(() => ({ companyId: null }));

  return (
    <div className="app-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Companies</h1>
        <p className="text-gray-600 mt-2">Manage all your companies in one place</p>
      </div>

      <CompanyManagementDashboard
        memberships={memberships}
        currentCompanyId={companyId}
      />
    </div>
  );
}
