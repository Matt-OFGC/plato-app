import { prisma } from "@/lib/prisma";
import { deleteIngredient } from "./actions";
import { getCurrentUserAndCompany } from "@/lib/current";
import { IngredientsPageClient } from "./IngredientsPageClient";

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

  // Fetch suppliers for bulk edit
  const suppliers = await prisma.supplier.findMany({
    where: { companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

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


