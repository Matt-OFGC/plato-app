import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { ProductionPlanEditor } from "@/components/ProductionPlanEditor";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductionPlanPage({ params }: Props) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) redirect("/dashboard");

  const { id } = await params;
  const planId = parseInt(id);

  // Get the production plan with all items
  const planRaw = await prisma.productionPlan.findUnique({
    where: { id: planId },
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
    },
  });

  if (!planRaw || planRaw.companyId !== companyId) {
    redirect("/dashboard/production");
  }

  // Serialize
  const plan = {
    ...planRaw,
    items: planRaw.items.map(item => ({
      ...item,
      recipe: {
        ...item.recipe,
        yieldQuantity: item.recipe.yieldQuantity.toString(),
      },
    })),
  };

  // Get all recipes for adding new items
  const recipesRaw = await prisma.recipe.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      yieldQuantity: true,
      yieldUnit: true,
      categoryId: true,
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
          Edit Production Plan
        </h1>
        <p className="text-gray-600">
          Add, remove, or adjust quantities for this production plan
        </p>
      </div>

      <ProductionPlanEditor
        plan={plan}
        recipes={recipes}
        companyId={companyId}
      />
    </div>
  );
}

