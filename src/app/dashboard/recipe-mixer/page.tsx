import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { RecipeMixer } from "@/components/RecipeMixer";

export const dynamic = 'force-dynamic';

export default async function RecipeMixerPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { companyId } = await getCurrentUserAndCompany();

  // Get all recipes with sections for the company
  const recipes = await prisma.recipe.findMany({
    where: { companyId },
    include: {
      sections: {
        include: {
          items: {
            include: {
              ingredient: {
                select: {
                  id: true,
                  name: true,
                  packQuantity: true,
                  packUnit: true,
                  packPrice: true,
                  densityGPerMl: true,
                  currency: true,
                },
              },
            },
          },
        },
        orderBy: { order: "asc" },
      },
      items: {
        include: {
          ingredient: {
            select: {
              id: true,
              name: true,
              packQuantity: true,
              packUnit: true,
              packPrice: true,
              densityGPerMl: true,
              currency: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Recipe Mixer
        </h1>
        <p className="text-gray-600">
          Mix and match sections from different recipes to create custom combinations
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Perfect for brownies with different toppings, layered cakes, and modular recipes
        </p>
      </div>

      <RecipeMixer recipes={recipes} />
    </div>
  );
}

