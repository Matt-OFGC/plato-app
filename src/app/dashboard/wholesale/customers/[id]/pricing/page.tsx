import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { CustomerPricingManager } from "@/components/CustomerPricingManager";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CustomerPricingPage({ params }: Props) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) redirect("/dashboard");

  const { id } = await params;
  const customerId = parseInt(id);

  // Get customer
  const customer = await prisma.wholesaleCustomer.findUnique({
    where: { id: customerId },
  });

  if (!customer || customer.companyId !== companyId) {
    redirect("/dashboard/wholesale");
  }

  // Get all recipes
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
      sellingPrice: true,
    },
    orderBy: { name: "asc" },
  });

  const recipes = recipesRaw.map(recipe => ({
    ...recipe,
    yieldQuantity: recipe.yieldQuantity.toString(),
    sellingPrice: recipe.sellingPrice?.toString() || null,
  }));

  // Get custom pricing for this customer
  const customPricingRaw = await prisma.customerPricing.findMany({
    where: { customerId },
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
  });

  const customPricing = customPricingRaw.map(pricing => ({
    ...pricing,
    price: pricing.price.toString(),
    recipe: {
      ...pricing.recipe,
      yieldQuantity: pricing.recipe.yieldQuantity.toString(),
    },
  }));

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => window.history.back()}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Pricing for {customer.name}
          </h1>
        </div>
        <p className="text-gray-600 ml-11">
          Set custom prices for this wholesale customer
        </p>
      </div>

      <CustomerPricingManager
        customer={customer}
        recipes={recipes}
        customPricing={customPricing}
      />
    </div>
  );
}

