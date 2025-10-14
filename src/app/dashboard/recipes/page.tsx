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
    
  const recipesRaw = await prisma.recipe.findMany({ 
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
      categoryRef: {
        select: {
          name: true,
          color: true,
        }
      },
      items: {
        select: {
          id: true,
        }
      },
    }
  });
  
  // Serialize Decimal fields for client component
  const recipes = recipesRaw.map(r => ({
    ...r,
    yieldQuantity: r.yieldQuantity.toString(),
  }));
  
  // Get categories from the already fetched recipes (no extra query needed)
  const categories = Array.from(new Set(recipes.map(r => r.categoryRef?.name).filter(Boolean) as string[])).sort();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Recipes</h1>
          <p className="text-[var(--muted-foreground)] mt-2">Create and manage your recipes with automatic cost calculation</p>
        </div>
        <div className="flex items-center gap-3">
          <SmartImporter type="recipes" />
          <Link href="/dashboard/recipes/new" className="btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Recipe
          </Link>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <SearchBar placeholder="Search recipes by name, description, or method..." />
        {categories.length > 0 && (
          <RecipeCategoryFilter categories={categories} selectedCategory={category} />
        )}
      </div>

      <RecipesView recipes={recipes} />
    </div>
  );
}


