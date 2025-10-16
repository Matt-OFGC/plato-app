import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteIngredient } from "./actions";
import { getCurrentUserAndCompany } from "@/lib/current";
import { SearchBar } from "@/components/SearchBar";
import { StalePriceAlerts } from "@/components/StalePriceAlerts";
import { SmartImporter } from "@/components/SmartImporter";
import { IngredientsView } from "@/components/IngredientsView";

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
      
  const ingredientsRaw = await prisma.ingredient.findMany({ 
    where, 
    include: { supplierRef: true },
    orderBy: { name: "asc" } 
  });

  // Serialize ingredients to convert Decimal to number for Client Components
  const ingredients = ingredientsRaw.map(ing => ({
    ...ing,
    packQuantity: ing.packQuantity.toNumber(),
    packPrice: ing.packPrice.toNumber(),
    densityGPerMl: ing.densityGPerMl?.toNumber() || null,
    supplierRef: ing.supplierRef ? {
      ...ing.supplierRef,
      minimumOrder: ing.supplierRef.minimumOrder ? Number(ing.supplierRef.minimumOrder) : null,
    } : null,
  }));

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-responsive-h2 text-[var(--foreground)]">Ingredients</h1>
          <p className="text-responsive-body text-[var(--muted-foreground)] mt-2">Manage your ingredient inventory and pricing data with automatic unit conversion</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <SmartImporter type="ingredients" />
          <Link href="/dashboard/ingredients/new" className="btn-responsive-primary flex items-center justify-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Ingredient
          </Link>
        </div>
      </div>

      {/* Stale Price Alerts */}
      <div className="mb-8">
        <StalePriceAlerts ingredients={ingredients.map(ing => ({
          id: ing.id,
          name: ing.name,
          lastPriceUpdate: ing.lastPriceUpdate,
          packPrice: ing.packPrice,
          supplier: ing.supplierRef?.name || ing.supplier || undefined,
        }))} />
      </div>

      <div className="mb-6">
        <SearchBar placeholder="Search ingredients by name, supplier, or notes..." />
      </div>

      <IngredientsView 
        ingredients={ingredients} 
        deleteIngredient={async (id: number) => {
          'use server';
          await deleteIngredient(id);
        }} 
      />
    </div>
  );
}


