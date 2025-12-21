import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { ShopifyIntegration } from "@/components/ShopifyIntegration";

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) redirect("/dashboard");

  // Check if user has ADMIN or OWNER role (ADMIN-only access)
  const membership = await prisma.membership.findUnique({
    where: {
      userId_companyId: {
        userId: user.id,
        companyId,
      },
    },
    select: {
      role: true,
      isActive: true,
    },
  });

  if (!membership || !membership.isActive || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
    redirect("/dashboard?error=access_denied");
  }

  // Get company with Shopify settings
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      shopifyStoreUrl: true,
      shopifyIsConnected: true,
      shopifyLastSync: true,
    },
  });

  if (!company) redirect("/dashboard");

  // Get Shopify product mappings
  const mappings = await prisma.shopifyProductMapping.findMany({
    where: {
      companyId,
      isActive: true,
    },
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
    orderBy: { productTitle: "asc" },
  });

  // Serialize
  const shopifyMappings = mappings.map(m => ({
    ...m,
    quantityMultiplier: m.quantityMultiplier.toString(),
    recipe: {
      ...m.recipe,
      yieldQuantity: m.recipe.yieldQuantity.toString(),
    },
  }));

  // Get all recipes for mapping
  const recipes = await prisma.recipe.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      yieldQuantity: true,
      yieldUnit: true,
    },
    orderBy: { name: "asc" },
  });

  const serializedRecipes = recipes.map(r => ({
    ...r,
    yieldQuantity: r.yieldQuantity.toString(),
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Integrations
        </h1>
        <p className="text-gray-600">
          Connect your store and automate order management
        </p>
      </div>

      <ShopifyIntegration
        company={company}
        mappings={shopifyMappings}
        recipes={serializedRecipes}
      />
    </div>
  );
}

