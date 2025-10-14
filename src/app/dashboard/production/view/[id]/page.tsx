import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { ProductionPlanView } from "@/components/ProductionPlanView";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ViewProductionPlanPage({ params }: Props) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) redirect("/dashboard");

  const { id } = await params;
  const planId = parseInt(id);

  // Get the production plan with all items, allocations, and sections
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
              method: true,
              imageUrl: true,
              categoryId: true,
              category: true,
              sections: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  method: true,
                  order: true,
                },
                orderBy: { order: 'asc' },
              },
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
        },
        orderBy: { priority: 'asc' },
      },
      tasks: {
        orderBy: { dueDate: 'asc' },
      },
    },
  });

  if (!planRaw || planRaw.companyId !== companyId) {
    redirect("/dashboard/production");
  }

  // Serialize Decimal fields
  const plan = {
    ...planRaw,
    items: planRaw.items.map((item: any) => ({
      ...item,
      quantity: item.quantity.toString(),
      recipe: {
        ...item.recipe,
        yieldQuantity: item.recipe.yieldQuantity.toString(),
      },
      allocations: item.allocations.map((alloc: any) => ({
        ...alloc,
        quantity: alloc.quantity.toString(),
      })),
    })),
    tasks: planRaw.tasks || [],
  };

  return (
    <ProductionPlanView
      plan={plan as any}
      companyId={companyId}
    />
  );
}

