import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteIngredient } from "./actions";
import { formatCurrency } from "@/lib/currency";
import { getCurrentUserAndCompany } from "@/lib/current";
import { fromBase, Unit } from "@/lib/units";
import { SearchBar } from "@/components/SearchBar";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ search?: string }>;
}

export default async function IngredientsPage({ searchParams }: Props) {
  const { search } = await searchParams;
  const { companyId } = await getCurrentUserAndCompany();
  
  const where = companyId 
    ? { 
        companyId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { supplier: { contains: search, mode: "insensitive" as const } },
            { notes: { contains: search, mode: "insensitive" as const } },
          ]
        })
      }
    : {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { supplier: { contains: search, mode: "insensitive" as const } },
            { notes: { contains: search, mode: "insensitive" as const } },
          ]
        })
      };
      
  const ingredients = await prisma.ingredient.findMany({ 
    where, 
    include: { supplierRef: true },
    orderBy: { name: "asc" } 
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Ingredients</h1>
          <p className="text-[var(--muted-foreground)] mt-2">Manage your ingredient inventory and pricing data with automatic unit conversion</p>
        </div>
        <Link href="/ingredients/new" className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Ingredient
        </Link>
      </div>

      <div className="mb-6">
        <SearchBar placeholder="Search ingredients by name, supplier, or notes..." />
      </div>

      {ingredients.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-[var(--secondary)] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No ingredients yet</h3>
          <p className="text-[var(--muted-foreground)] mb-6">Get started by adding your first ingredient</p>
          <Link href="/ingredients/new" className="btn-primary">
            Add First Ingredient
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ingredients.map((ing) => (
            <div key={ing.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 active:scale-95">
              {/* Ingredient Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>

              {/* Ingredient Info */}
              <div className="space-y-3">
                <div>
                  <Link href={`/ingredients/${ing.id}`} className="text-lg font-semibold text-gray-900 hover:text-emerald-600 transition-colors">
                    {ing.name}
                  </Link>
                  {(ing.supplierRef || ing.supplier) && (
                    <p className="text-sm text-gray-600 mt-1">
                      Supplier: {ing.supplierRef?.name || ing.supplier}
                      {ing.supplierRef?.contactName && (
                        <span className="text-gray-500"> ({ing.supplierRef.contactName})</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Pack Size:</span>
                    <span className="font-medium text-gray-900">
                      {(() => {
                        const originalUnit = ing.originalUnit || ing.packUnit;
                        const originalQuantity = ing.originalUnit 
                          ? fromBase(Number(ing.packQuantity), originalUnit as Unit, ing.densityGPerMl ? Number(ing.densityGPerMl) : undefined)
                          : Number(ing.packQuantity);
                        return `${originalQuantity} ${originalUnit}`;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(Number(ing.packPrice), ing.currency)}
                    </span>
                  </div>
                  {ing.densityGPerMl && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Density:</span>
                      <span className="font-medium text-gray-900">
                        {String(ing.densityGPerMl)} g/ml
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Link 
                    href={`/ingredients/${ing.id}`}
                    className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium text-center"
                  >
                    Edit
                  </Link>
                  <form action={async () => { 'use server'; await deleteIngredient(ing.id); }} className="inline">
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


