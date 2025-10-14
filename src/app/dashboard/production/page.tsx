import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { ProductionPlannerEnhanced } from "@/components/ProductionPlannerEnhanced";

export const dynamic = 'force-dynamic';

export default async function ProductionPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) redirect("/dashboard");

  // Get all recipes for the company with sections
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
  });

  // Serialize Decimal objects to strings for client components
  const recipes = recipesRaw.map(recipe => ({
    ...recipe,
    yieldQuantity: recipe.yieldQuantity.toString(),
  }));

  // Get current production plans with allocations
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
          allocations: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          completedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
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
      quantity: item.quantity.toString(),
      recipe: {
        ...item.recipe,
        yieldQuantity: item.recipe.yieldQuantity.toString(),
      },
      allocations: item.allocations.map(alloc => ({
        ...alloc,
        quantity: alloc.quantity.toString(),
      })),
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

  // Get wholesale customers
  const wholesaleCustomers = await prisma.wholesaleCustomer.findMany({
    where: {
      companyId,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Production Planning
        </h1>
        <p className="text-gray-600">
          Plan your weekly bake schedule and organize multi-day production
        </p>
      </div>

      <ProductionPlannerEnhanced
        recipes={recipes}
        productionPlans={productionPlans}
        teamMembers={teamMembers}
        wholesaleCustomers={wholesaleCustomers}
        companyId={companyId!}
      />
    </div>
  );
}

