import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteRecipe } from "./actions";
import { getCurrentUserAndCompany } from "@/lib/current";
import { RecipeCategoryFilter } from "@/components/RecipeCategoryFilter";
import { SearchBar } from "@/components/SearchBar";

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
        ...(category && { categoryRef: { name: category } }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { method: { contains: search, mode: "insensitive" as const } },
          ]
        })
      }
    : { 
        ...(category && { categoryRef: { name: category } }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { method: { contains: search, mode: "insensitive" as const } },
          ]
        })
      };
    
  const recipes = await prisma.recipe.findMany({ 
    where, 
    orderBy: { name: "asc" }, 
    include: { 
      items: {
        include: {
          ingredient: {
            select: {
              id: true,
              name: true,
              packPrice: true,
              packQuantity: true,
              packUnit: true
            }
          }
        }
      },
      categoryRef: true 
    } 
  });
  
  // Get categories from the already fetched recipes (no extra query needed)
  const categories = Array.from(new Set(recipes.map(r => r.categoryRef?.name).filter(Boolean) as string[])).sort();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Recipes</h1>
          <p className="text-[var(--muted-foreground)] mt-2">Create and manage your recipes with automatic cost calculation</p>
        </div>
        <Link href="/dashboard/recipes/new" className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Recipe
        </Link>
      </div>

      <div className="mb-6 space-y-4">
        <SearchBar placeholder="Search recipes by name, description, or method..." />
        {categories.length > 0 && (
          <RecipeCategoryFilter categories={categories} selectedCategory={category} />
        )}
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-[var(--secondary)] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No recipes yet</h3>
          <p className="text-[var(--muted-foreground)] mb-6">Create your first recipe to get started</p>
          <Link href="/dashboard/recipes/new" className="btn-primary">
            Create Recipe
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
              {/* Recipe Image Placeholder */}
              <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-amber-100 rounded-xl mb-4 flex items-center justify-center">
                {r.imageUrl ? (
                  <img 
                    src={r.imageUrl} 
                    alt={r.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="text-center">
                    <svg className="w-12 h-12 text-indigo-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">No image</p>
                  </div>
                )}
              </div>

              {/* Recipe Info */}
              <div className="space-y-3">
                <div>
                  <Link href={`/dashboard/recipes/${r.id}/view`} className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                    {r.name}
                  </Link>
                  {r.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Yield: {String(r.yieldQuantity)} {r.yieldUnit}</span>
                    <span>{r.items.length} ingredient{r.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  
                  {/* Recipe Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    {r.categoryRef && (
                      <div className="flex items-center gap-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: r.categoryRef.color || "#3B82F6" }}
                        />
                        <span className="truncate">{r.categoryRef.name}</span>
                      </div>
                    )}
                    {r.bakeTime && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{r.bakeTime}min</span>
                      </div>
                    )}
                    {r.bakeTemp && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>{r.bakeTemp}°C</span>
                      </div>
                    )}
                    {r.storage && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="truncate">{r.storage}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Link 
                    href={`/dashboard/recipes/${r.id}/view`}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium text-center"
                  >
                    View
                  </Link>
                  <Link 
                    href={`/dashboard/recipes/${r.id}`}
                    className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium text-center"
                  >
                    Edit
                  </Link>
                  <form action={async () => { 'use server'; await deleteRecipe(r.id); }} className="inline">
                    <button 
                      type="submit" 
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


