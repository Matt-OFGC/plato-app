import { prisma } from "@/lib/prisma";
import { deleteRecipe } from "@/app/dashboard/recipes/actions";
import { getCurrentUserAndCompany } from "@/lib/current";
import { RecipeCategoryFilter } from "@/components/RecipeCategoryFilter";
import { RecipesViewWithBulkActions } from "@/components/RecipesViewWithBulkActions";
import { RecipesPageClient } from "@/app/dashboard/recipes/RecipesPageClient";
import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { hasAppAccess } from "@/lib/user-app-subscriptions";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ category?: string; search?: string; minCost?: string; maxCost?: string }>;
}

export default async function BakeRecipesPage({ searchParams }: Props) {
  const user = await getUserFromSession();
  if (!user) redirect("/bake/login?redirect=/bake/recipes");

  // Verify user has access to Plato Bake
  // In development, always allow access (handled in hasAppAccess)
  // In production, show paywall instead of redirecting to main dashboard
  const hasAccess = await hasAppAccess(user.id, "plato_bake");
  if (!hasAccess) {
    // Don't redirect to main dashboard - Plato Bake should be independent
    // Show access denied message instead
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Access Required</h1>
        <p className="text-gray-600 mb-4">You need a Plato Bake subscription to access this page.</p>
        <a href="/bake/pricing" className="text-[var(--brand-primary)] hover:underline">
          View Pricing & Subscribe
        </a>
      </div>
    );
  }

  const { category, search, minCost, maxCost } = await searchParams;
  
  // Get company ID - handle errors gracefully for Plato Bake independence
  let companyId: number | null = null;
  try {
    const result = await getCurrentUserAndCompany();
    companyId = result.companyId;
  } catch (error) {
    console.error("[BakeRecipesPage] Error getting company:", error);
    // Don't redirect - show error message instead
    // Plato Bake should be independent and not redirect to main dashboard
  }
  
  // If no company, show error instead of redirecting
  if (!companyId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Unable to Load Recipes</h1>
        <p className="text-gray-600">Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    );
  }
  
  const where = companyId 
    ? { 
        companyId, 
        ...(category && { categoryRef: { is: { name: category } } }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { method: { contains: search, mode: "insensitive" as const } },
          ]
        })
      }
    : { 
        ...(category && { categoryRef: { is: { name: category } } }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { method: { contains: search, mode: "insensitive" as const } },
          ]
        })
      };
  
  // Note: Cost filtering will be applied client-side after calculating costs
  // This is because costs are calculated from ingredients dynamically
    
  let recipesRaw: any[] = [];
  
  try {
    recipesRaw = await prisma.recipe.findMany({ 
      where, 
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        yieldQuantity: true,
        yieldUnit: true,
        imageUrl: true,
        bakeTime: true,
        bakeTemp: true,
        storage: true,
        sellingPrice: true,
        category: true,
        categoryRef: {
          select: {
            name: true,
            color: true,
          }
        },
        items: {
          select: {
            id: true,
            quantity: true,
            ingredient: {
              select: {
                packPrice: true,
                packQuantity: true,
              }
            }
          }
        },
        sections: {
          select: {
            id: true,
            bakeTime: true,
          }
        }
      }
    });
  } catch (error) {
    const { logger } = await import("@/lib/logger");
    logger.error('Database error in recipes page:', error);
    // Use empty array to prevent page crash
    recipesRaw = [];
  }
  
  // Serialize Decimal fields and calculate derived values for client component
  const recipes = recipesRaw.map(r => {
    // Serialize items with Decimal quantities
    const serializedItems = r.items.map(item => ({
      ...item,
      quantity: item.quantity.toString(), // Convert Decimal to string
      ingredient: {
        ...item.ingredient,
        packPrice: item.ingredient.packPrice ? item.ingredient.packPrice.toString() : null,
        packQuantity: item.ingredient.packQuantity ? item.ingredient.packQuantity.toString() : null,
      }
    }));

    // Calculate total cost
    const totalCost = serializedItems.reduce((sum, item) => {
      const costPerUnit = item.ingredient.packPrice && item.ingredient.packQuantity
        ? Number(item.ingredient.packPrice) / Number(item.ingredient.packQuantity)
        : 0;
      return sum + (Number(item.quantity) * costPerUnit);
    }, 0);
    
    // Calculate cost per serving (divide total cost by yield)
    const yieldQty = Number(r.yieldQuantity);
    const costPerServing = yieldQty > 0 ? totalCost / yieldQty : totalCost;
    
    // Calculate COGS percentage (cost per serving / sell price)
    // Sell price is already per serving/slice, so we compare like-for-like
    const cogsPercentage = r.sellingPrice && Number(r.sellingPrice) > 0
      ? (costPerServing / Number(r.sellingPrice)) * 100
      : null;
    
    // Calculate total time from all sections
    const totalTime = r.sections.reduce((sum, section) => {
      return sum + (section.bakeTime ? Number(section.bakeTime) : 0);
    }, 0);
    
    return {
      ...r,
      yieldQuantity: r.yieldQuantity.toString(),
      sellingPrice: r.sellingPrice ? Number(r.sellingPrice) : null,
      items: serializedItems, // Use serialized items
      totalCost,
      costPerServing,
      cogsPercentage,
      totalSteps: r.sections.length,
      totalTime: totalTime > 0 ? totalTime : null,
      category: r.categoryRef?.name || r.category || null,
    };
  });
  
  // Apply cost filtering if minCost or maxCost are specified
  let filteredRecipes = recipes;
  if (minCost || maxCost) {
    filteredRecipes = recipes.filter((r) => {
      const cost = r.totalCost || 0;
      if (minCost && cost < Number(minCost)) return false;
      if (maxCost && cost > Number(maxCost)) return false;
      return true;
    });
  }

  // Get categories from the already fetched recipes (no extra query needed)
  const categories = Array.from(new Set(recipes.map(r => r.categoryRef?.name).filter(Boolean) as string[])).sort();

  // Fetch categories with IDs for bulk edit
  const categoriesWithIds = await prisma.category.findMany({
    where: { companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <RecipesPageClient>
      <div className="w-full">
        {/* Page Header */}
        <div className="mb-3 md:mb-4 lg:mb-6 xl:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 tracking-tight mb-1 md:mb-2">Recipes</h1>
          <p className="text-gray-500 text-xs md:text-sm lg:text-base xl:text-lg mb-3 md:mb-4 lg:mb-6">Create and manage your recipes with automatic cost calculation</p>
        </div>

        {/* Category Filter with Search */}
        <div className="mb-4 md:mb-5 lg:mb-6 w-full">
          <RecipeCategoryFilter categories={categories} selectedCategory={category} />
        </div>

        <div className="w-full">
          <RecipesViewWithBulkActions recipes={filteredRecipes} categories={categoriesWithIds} />
        </div>
      </div>
    </RecipesPageClient>
  );
}
