import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateIngredient } from "../actions";
import { fromBase, Unit, BaseUnit } from "@/lib/units";
import { IngredientForm } from "@/components/IngredientForm";
import { getCurrentUserAndCompany } from "@/lib/current";
import { RecentItemsTracker } from "@/components/RecentItemsTracker";

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }> }

// Server action for updating ingredient
async function handleIngredientUpdate(id: number, formData: FormData) {
  "use server";
  await updateIngredient(id, formData);
}

export default async function EditIngredientPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const { companyId } = await getCurrentUserAndCompany();
  
  const ing = await prisma.ingredient.findUnique({ 
    where: { id },
    include: { supplierRef: true }
  });
  
  if (!ing) return <div className="p-6">Not found</div>;
  
  // Security check: Verify ingredient belongs to user's company
  if (ing.companyId !== companyId) {
    return <div className="p-6">Unauthorized</div>;
  }
  
  // Get suppliers for the dropdown (company-scoped)
  const suppliersRaw = await prisma.supplier.findMany({
    where: companyId ? { companyId } : {},
    orderBy: { name: "asc" }
  });

  // Serialize suppliers to convert Decimal to number for Client Components
  const suppliers = suppliersRaw.map(supplier => ({
    ...supplier,
    minimumOrder: supplier.minimumOrder ? Number(supplier.minimumOrder) : null,
  }));

  // Calculate the original quantity to display
  // Convert from base unit (stored in packUnit) back to original unit
  const originalUnit = ing.originalUnit || ing.packUnit;
  const originalQuantity = ing.originalUnit 
    ? fromBase(Number(ing.packQuantity), ing.packUnit as BaseUnit, originalUnit as Unit)
    : Number(ing.packQuantity);

  // Parse batchPricing - Prisma Json type returns JavaScript objects directly, not strings
  let parsedBatchPricing: any = null;
  if (ing.batchPricing !== null && ing.batchPricing !== undefined) {
    try {
      // If it's already an object/array (Prisma Json type), use it directly
      // If it's a string (legacy), parse it
      if (typeof ing.batchPricing === 'string') {
        parsedBatchPricing = JSON.parse(ing.batchPricing);
      } else {
        parsedBatchPricing = ing.batchPricing;
      }
    } catch (e) {
      console.error('EditIngredientPage: Error parsing batchPricing:', e);
      parsedBatchPricing = null;
    }
  }

  // Create a bound function for the IngredientForm
  const handleSubmit = handleIngredientUpdate.bind(null, id);

  // Prepare batchPricingJson - always pass as stringified JSON (never undefined)
  // Use empty array if null/undefined to ensure prop is always present
  const batchPricingForJson = (parsedBatchPricing !== null && parsedBatchPricing !== undefined && Array.isArray(parsedBatchPricing) && parsedBatchPricing.length > 0)
    ? parsedBatchPricing
    : [];
  const batchPricingJson = JSON.stringify(batchPricingForJson);
  
  // Build initialData object (batchPricing will be stripped by RSC, so we rely on batchPricingJson)
  const initialFormData = {
    name: ing.name,
    supplierId: ing.supplierId || undefined,
    packQuantity: originalQuantity,
    packUnit: ing.originalUnit || ing.packUnit,
    packPrice: Number(ing.packPrice),
    densityGPerMl: ing.densityGPerMl ? Number(ing.densityGPerMl) : undefined,
    notes: ing.notes || "",
    allergens: ing.allergens || [],
    customConversions: ing.customConversions || undefined,
  };

  return (
    <div className="app-container">
      <RecentItemsTracker
        id={ing.id}
        type="ingredient"
        name={ing.name}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Ingredient</h1>
        <p className="text-gray-600 mt-2">Update ingredient details and pricing</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <IngredientForm
          companyId={companyId || undefined}
          suppliers={suppliers}
          initialData={initialFormData}
          batchPricingJson={batchPricingJson}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}


