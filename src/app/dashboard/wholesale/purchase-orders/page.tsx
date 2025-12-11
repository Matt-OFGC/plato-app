import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { PurchaseOrdersPage } from "./PurchaseOrdersPage";

export const dynamic = 'force-dynamic';
export const revalidate = 120;

export default async function PurchaseOrdersPageWrapper() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { companyId } = await getCurrentUserAndCompany();

  // Fetch suppliers
  const suppliersRaw = await prisma.supplier.findMany({
    where: { companyId: companyId! },
    select: {
      id: true,
      name: true,
      contactName: true,
      email: true,
      phone: true,
    },
    orderBy: { name: "asc" },
  });

  // Fetch ingredients
  const ingredientsRaw = await prisma.ingredient.findMany({
    where: { companyId: companyId! },
    select: {
      id: true,
      name: true,
      packQuantity: true,
      packUnit: true,
      packPrice: true,
      currency: true,
    },
    orderBy: { name: "asc" },
  });

  // Serialize Decimal fields
  const suppliers = suppliersRaw.map(supplier => ({
    ...supplier,
  }));

  const ingredients = ingredientsRaw.map(ingredient => ({
    ...ingredient,
    packPrice: ingredient.packPrice.toString(),
  }));

  return (
    <PurchaseOrdersPage
      suppliers={suppliers}
      ingredients={ingredients}
      companyId={companyId!}
    />
  );
}
