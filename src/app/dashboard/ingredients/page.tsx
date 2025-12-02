import { prisma } from "@/lib/prisma";
import { deleteIngredient } from "./actions";
import { getCurrentUserAndCompany } from "@/lib/current";
import { IngredientsPageClient } from "./IngredientsPageClient";
import { getOrCompute, CacheKeys, CACHE_TTL } from "@/lib/redis";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ search?: string }>;
}

export default async function IngredientsPage({ searchParams }: Props) {
  // Note: We don't use search here - filtering is done client-side for live search
  let companyId: number | null = null;
  try {
    const result = await getCurrentUserAndCompany();
    companyId = result.companyId;
  } catch (error) {
    // If getCurrentUserAndCompany fails, return empty state
    return <IngredientsPageClient ingredients={[]} companyId={0} suppliers={[]} deleteIngredient={async () => {}} />;
  }
  
  if (!companyId) {
    return <IngredientsPageClient ingredients={[]} companyId={0} suppliers={[]} deleteIngredient={async () => {}} />;
  }

  // Load ALL ingredients with Redis caching - filtering happens client-side for instant live search
  // Use select instead of include to only fetch needed fields for better performance
  const ingredients = await getOrCompute(
    CacheKeys.ingredients(companyId),
    async () => {
      const ingredientsRaw = await prisma.ingredient.findMany({ 
        where: { companyId },
        select: {
          id: true,
          name: true,
          supplier: true,
          supplierId: true,
          packQuantity: true,
          packUnit: true,
          packPrice: true,
          currency: true,
          densityGPerMl: true,
          allergens: true,
          notes: true,
          lastPriceUpdate: true,
          customConversions: true,
          batchPricing: true,
          servingsPerPack: true,
          servingUnit: true,
          supplierRef: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              minimumOrder: true,
            }
          }
        },
        orderBy: { name: "asc" } 
      });

      // Serialize ingredients to convert Decimal to number for Client Components
      return ingredientsRaw.map(ing => ({
        ...ing,
        packQuantity: ing.packQuantity.toNumber(),
        packPrice: ing.packPrice.toNumber(),
        densityGPerMl: ing.densityGPerMl?.toNumber() || null,
        supplierRef: ing.supplierRef ? {
          ...ing.supplierRef,
          minimumOrder: ing.supplierRef.minimumOrder ? Number(ing.supplierRef.minimumOrder) : null,
        } : null,
      }));
    },
    CACHE_TTL.INGREDIENTS
  );

  // Fetch suppliers for bulk edit with caching
  const suppliers = await getOrCompute(
    CacheKeys.suppliers(companyId),
    async () => {
      return await prisma.supplier.findMany({
        where: { companyId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
    },
    CACHE_TTL.SUPPLIERS
  );

  return (
    <IngredientsPageClient 
      ingredients={ingredients} 
      companyId={companyId || 0}
      suppliers={suppliers}
      deleteIngredient={async (id: number) => {
        'use server';
        await deleteIngredient(id);
      }} 
    />
  );
}


