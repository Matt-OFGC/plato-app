import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany, getUserRoleInCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { CompanyLoadingErrorServer } from "@/components/CompanyLoadingErrorServer";
import { WholesaleCustomers } from "@/components/WholesaleCustomers";

export const dynamic = 'force-dynamic';

export default async function WholesaleCustomersPage() {
  try {
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
        select: {
          id: true,
          name: true,
          contactName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          postcode: true,
          country: true,
          notes: true,
          isActive: true,
          customerType: true,
          portalToken: true,
          portalEnabled: true,
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
          customers={customers}
        companyId={companyId}
      />
    </div>
  );
  } catch (error) {
    console.error('Wholesale customers page error:', error);
    const { CompanyLoadingErrorServer } = await import("@/components/CompanyLoadingErrorServer");
    let result;
    try {
      result = await getCurrentUserAndCompany();
    } catch {
      const user = await getUserFromSession().catch(() => null);
      result = {
        companyId: null,
        company: null,
        user: user ? { 
          id: user.id, 
          email: user.email, 
          name: user.name || undefined, 
          isAdmin: false, 
          memberships: [] 
        } : {
          id: 0,
          email: '',
          name: undefined,
          isAdmin: false,
          memberships: []
        },
        app: null,
        appConfig: null,
      };
    }
    return (
      <CompanyLoadingErrorServer 
        result={result} 
        page="wholesale-customers"
      />
    );
  }
}


