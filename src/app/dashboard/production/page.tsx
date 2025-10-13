import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { ProductionPlanner } from "@/components/ProductionPlanner";

export const dynamic = 'force-dynamic';

export default async function ProductionPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { companyId } = await getCurrentUserAndCompany();

  // Get all recipes for the company
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
    },
    orderBy: { name: "asc" },
  });

  // Serialize Decimal objects to strings for client components
  const recipes = recipesRaw.map(recipe => ({
    ...recipe,
    yieldQuantity: recipe.yieldQuantity.toString(),
  }));

  // Get current production plans
  const productionPlansRaw = await prisma.productionPlan.findMany({
    where: { companyId },
    include: {
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
      tasks: true,
    },
    orderBy: { startDate: "desc" },
    take: 10,
  });

  // Serialize Decimal objects to strings for client components
  const productionPlans = productionPlansRaw.map(plan => ({
    ...plan,
    items: plan.items.map(item => ({
      ...item,
      recipe: {
        ...item.recipe,
        yieldQuantity: item.recipe.yieldQuantity.toString(),
      },
    })),
  }));

  // Get team members for task assignment
  const teamMembers = await prisma.membership.findMany({
    where: { 
      companyId,
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Production Planning
        </h1>
        <p className="text-gray-600">
          Plan your weekly bake schedule and assign tasks to your team
        </p>
      </div>

      <ProductionPlanner
        recipes={recipes}
        productionPlans={productionPlans}
        teamMembers={teamMembers}
        companyId={companyId!}
      />
    </div>
  );
}

