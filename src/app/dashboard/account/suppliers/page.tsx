import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { SupplierManager } from "@/components/SupplierManager";

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");
  
  const { companyId } = await getCurrentUserAndCompany();

  // Get user's suppliers
  const suppliersRaw = await prisma.supplier.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { ingredients: true }
      }
    },
    orderBy: { name: "asc" }
  });

  // Serialize suppliers to convert Decimal to number for Client Components
  const suppliers = suppliersRaw.map(supplier => ({
    ...supplier,
    minimumOrder: supplier.minimumOrder ? Number(supplier.minimumOrder) : null,
  }));

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-2">Suppliers</h1>
        <p className="text-gray-500 text-lg mb-6">Manage your ingredient suppliers and their details</p>
      </div>

      {/* Suppliers Content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <SupplierManager suppliers={suppliers} />
      </div>
    </div>
  );
}



