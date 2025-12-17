import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany, getUserRoleInCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { CompanyLoadingErrorServer } from "@/components/CompanyLoadingErrorServer";
import { WholesaleCustomers } from "@/components/WholesaleCustomers";

export const dynamic = 'force-dynamic';

export default async function WholesaleCustomersPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard/wholesale/customers");

  const result = await getCurrentUserAndCompany();
  const { companyId } = result;
  
  // Show error component if companyId is null
  if (!companyId) {
    return <CompanyLoadingErrorServer result={result} page="wholesale-customers" />;
  }

  // Get user's role in the company
  const currentUserRole = await getUserRoleInCompany(user.id, companyId) || "MEMBER";

  // Get wholesale customers
  let customers = [];

  try {
    customers = await prisma.wholesaleCustomer.findMany({
      where: { companyId },
      include: {
        _count: {
          select: {
            orders: true,
            productionItems: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching wholesale customers:", error);
    // Continue with empty array - page will still render
  }

  return (
    <div className="space-y-6">
      <WholesaleCustomers
        customers={customers.map(c => ({
          ...c,
          outstandingBalance: c.outstandingBalance?.toString(),
          totalValue: c.totalValue.toString(),
          totalPaid: c.totalPaid.toString(),
        }))}
        companyId={companyId}
      />
    </div>
  );
}


