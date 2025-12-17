import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { CompanyLoadingErrorServer } from "@/components/CompanyLoadingErrorServer";
import { WholesaleProducts } from "@/components/WholesaleProducts";

export const dynamic = 'force-dynamic';

export default async function WholesaleProductsPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const result = await getCurrentUserAndCompany();
  const { companyId } = result;
  
  // Show error component if companyId is null
  if (!companyId) {
    return <CompanyLoadingErrorServer result={result} page="wholesale-products" />;
  }

  // Get all wholesale products for the company
  const productsRaw = await prisma.wholesaleProduct.findMany({
    where: { companyId },
    include: {
      recipe: {
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          yieldQuantity: true,
          yieldUnit: true,
          category: true,
        },
      },
    },
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  });

  // Serialize Decimal fields
  const products = productsRaw.map((product) => ({
    ...product,
    price: product.price.toString(),
    recipe: product.recipe
      ? {
          ...product.recipe,
          yieldQuantity: product.recipe.yieldQuantity.toString(),
        }
      : null,
  }));

  // Get recipes for dropdown
  const recipesRaw = await prisma.recipe.findMany({
    where: {
      companyId,
      isSubRecipe: false,
    },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      yieldQuantity: true,
      yieldUnit: true,
      category: true,
      sellingPrice: true,
    },
    orderBy: { name: "asc" },
  });

  const recipes = recipesRaw.map((recipe) => ({
    ...recipe,
    yieldQuantity: recipe.yieldQuantity.toString(),
    sellingPrice: recipe.sellingPrice ? recipe.sellingPrice.toString() : null,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Wholesale Product Catalogue
        </h1>
        <p className="text-gray-600">
          Manage products available to your wholesale customers
        </p>
      </div>

      <WholesaleProducts
        products={products}
        recipes={recipes}
        companyId={companyId}
      />
    </div>
  );
}

