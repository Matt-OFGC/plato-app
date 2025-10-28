import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { InventoryManager } from "@/components/InventoryManager";

// Cache for 2 minutes to improve performance
export const revalidate = 120;

export default async function InventoryPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) redirect("/dashboard");

  // Get all inventory items
  const inventoryRaw = await prisma.inventory.findMany({
    where: { companyId },
    include: {
      recipe: {
        select: {
          id: true,
          name: true,
          yieldQuantity: true,
          yieldUnit: true,
          category: true,
          imageUrl: true,
        },
      },
      movements: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { recipe: { name: "asc" } },
  });

  // Serialize
  const inventory = inventoryRaw.map(inv => ({
    ...inv,
    quantity: inv.quantity.toString(),
    lowStockThreshold: inv.lowStockThreshold?.toString() || null,
    recipe: {
      ...inv.recipe,
      yieldQuantity: inv.recipe.yieldQuantity.toString(),
    },
    movements: inv.movements.map(mov => ({
      ...mov,
      quantity: mov.quantity.toString(),
    })),
  }));

  // Get recipes for adding new inventory items
  const recipesRaw = await prisma.recipe.findMany({
    where: {
      companyId,
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
          Inventory Management
        </h1>
        <p className="text-gray-600">
          Track stock levels, movements, and set low stock alerts
        </p>
      </div>

      <InventoryManager
        inventory={inventory}
        recipes={recipes}
        companyId={companyId}
      />
    </div>
  );
}

