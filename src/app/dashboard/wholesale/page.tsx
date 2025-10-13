import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { WholesaleCustomers } from "@/components/WholesaleCustomers";

export const dynamic = 'force-dynamic';

export default async function WholesalePage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { companyId } = await getCurrentUserAndCompany();

  // Get all wholesale customers for the company
  const customersRaw = await prisma.wholesaleCustomer.findMany({
    where: { companyId: companyId! },
    include: {
      _count: {
        select: {
          productionItems: true,
          orders: true,
        },
      },
    },
    orderBy: [
      { isActive: "desc" },
      { name: "asc" },
    ],
  });

  // Serialize for client component
  const customers = customersRaw;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Wholesale Customers
        </h1>
        <p className="text-gray-600">
          Manage your wholesale customers and track orders
        </p>
      </div>

      <WholesaleCustomers
        customers={customers}
        companyId={companyId!}
      />
    </div>
  );
}

