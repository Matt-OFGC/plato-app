import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteRecipe } from "./actions";
import { getCurrentUserAndCompany } from "@/lib/current";
import { RecipeCategoryFilter } from "@/components/RecipeCategoryFilter";
import { SearchBar } from "@/components/SearchBar";
import { SmartImporter } from "@/components/SmartImporter";
import { RecipesView } from "@/components/RecipesView";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ category?: string; search?: string }>;
}

export default async function RecipesPage({ searchParams }: Props) {
  const { category, search } = await searchParams;
  const { companyId } = await getCurrentUserAndCompany();
  
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
  
  // Get categories from the already fetched recipes (no extra query needed)
  const categories = Array.from(new Set(recipes.map(r => r.categoryRef?.name).filter(Boolean) as string[])).sort();

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-responsive-h2 text-[var(--foreground)]">Recipes</h1>
          <p className="text-responsive-body text-[var(--muted-foreground)] mt-2">Create and manage your recipes with automatic cost calculation</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <SmartImporter type="recipes" />
          <Link href="/dashboard/recipes/new" className="btn-responsive-primary flex items-center justify-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Recipe
          </Link>
        </div>
      </div>

      <div className="mb-4 sm:mb-6 space-y-4">
        <SearchBar placeholder="Search recipes by name, description, or method..." />
        {categories.length > 0 && (
          <RecipeCategoryFilter categories={categories} selectedCategory={category} />
        )}
      </div>

      <RecipesView recipes={recipes} />
    </div>
  );
}


