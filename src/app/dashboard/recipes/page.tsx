import { prisma } from "@/lib/prisma";
import { deleteRecipe } from "./actions";
import { getCurrentUserAndCompany } from "@/lib/current";
import { RecipeCategoryFilter } from "@/components/RecipeCategoryFilter";
import { RecipesViewWithBulkActions } from "@/components/RecipesViewWithBulkActions";
import { RecipesPageClient } from "./RecipesPageClient";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ category?: string; search?: string; minCost?: string; maxCost?: string }>;
}

export default async function RecipesPage({ searchParams }: Props) {
  const { category, search, minCost, maxCost } = await searchParams;
  const { companyId } = await getCurrentUserAndCompany();
  
  // Filter out test recipes - exclude recipes with "test" in name (case-insensitive)
  // and recipes from test companies
  const where = companyId 
    ? { 
        companyId, 
        // Exclude test recipes
        NOT: {
          OR: [
            { name: { contains: "test", mode: "insensitive" as const } },
            { name: { contains: "Test Category" } },
          ]
        },
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
        // Exclude test recipes even if no companyId
        NOT: {
          OR: [
            { name: { contains: "test", mode: "insensitive" as const } },
            { name: { contains: "Test Category" } },
          ]
        },
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


