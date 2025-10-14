import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { WholesaleOrders } from "@/components/WholesaleOrders";

export const dynamic = 'force-dynamic';

export default async function WholesaleOrdersPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { companyId } = await getCurrentUserAndCompany();

  // Get all wholesale orders for the company
  const ordersRaw = await prisma.wholesaleOrder.findMany({
    where: { companyId: companyId! },
    include: {
      customer: true,
      items: {
        include: {
          recipe: {
            select: {
              id: true,
              name: true,
              yieldQuantity: true,
              yieldUnit: true,
            },
          },
        },
      },
    },
    orderBy: [
      { status: "asc" },
      { deliveryDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  // Serialize Decimal fields
  const orders = ordersRaw.map(order => ({
    ...order,
    items: order.items.map(item => ({
      ...item,
      recipe: {
        ...item.recipe,
        yieldQuantity: item.recipe.yieldQuantity.toString(),
      },
    })),
  }));

  // Get customers for dropdown
  const customers = await prisma.wholesaleCustomer.findMany({
    where: {
      companyId: companyId!,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });

  // Get recipes for order items
  const recipesRaw = await prisma.recipe.findMany({
    where: {
      companyId: companyId!,
      isSubRecipe: false,
    },
    select: {
      id: true,
      name: true,
      yieldQuantity: true,
      yieldUnit: true,
      category: true,
    },
    orderBy: { name: "asc" },
  });

  const recipes = recipesRaw.map(recipe => ({
    ...recipe,
    yieldQuantity: recipe.yieldQuantity.toString(),
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Wholesale Orders
        </h1>
        <p className="text-gray-600">
          Manage incoming orders from your wholesale customers
        </p>
      </div>

      <WholesaleOrders
        orders={orders}
        customers={customers}
        recipes={recipes}
        companyId={companyId!}
      />
    </div>
  );
}

