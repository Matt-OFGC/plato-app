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

  // Get basic recipes for adding new inventory items - much lighter query
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
    take: 100, // Limit for performance
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
        inventory={[]}
        recipes={recipes}
        companyId={companyId}
      />
    </div>
  );
}