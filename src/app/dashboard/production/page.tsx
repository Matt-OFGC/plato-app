import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { ProductionPlannerEnhanced } from "@/components/ProductionPlannerEnhanced";

// Cache for 2 minutes to improve performance
export const revalidate = 120;

export default async function ProductionPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) redirect("/dashboard");

  // Get basic recipes data - much lighter query
  const recipesRaw = await prisma.recipe.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      yieldQuantity: true,
      yieldUnit: true,
      categoryId: true,
      category: true,
      imageUrl: true,
      sections: {
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { name: "asc" },
    take: 50, // Limit for performance
  });

  // Serialize Decimal objects to strings for client components
  const recipes = recipesRaw.map(recipe => ({
    ...recipe,
    yieldQuantity: recipe.yieldQuantity.toString(),
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Production Planning
        </h1>
        <p className="text-gray-600">
          Plan production schedules, manage tasks, and track progress
        </p>
      </div>

      <ProductionPlannerEnhanced
        recipes={recipes}
        productionPlans={[]}
        teamMembers={[]}
        wholesaleCustomers={[]}
        companyId={companyId}
      />
    </div>
  );
}