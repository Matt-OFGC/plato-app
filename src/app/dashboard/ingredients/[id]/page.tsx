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
  
  // Debug: Log raw batchPricing from database
  console.log('EditIngredientPage: Raw batchPricing from DB:', {
    value: ing.batchPricing,
    type: typeof ing.batchPricing,
    isNull: ing.batchPricing === null,
    isUndefined: ing.batchPricing === undefined,
    stringified: JSON.stringify(ing.batchPricing)
  });

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

  // Parse batchPricing for debugging
  // Prisma Json type returns JavaScript objects directly, not strings
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
      console.log('EditIngredientPage: Loaded batchPricing:', JSON.stringify(parsedBatchPricing, null, 2));
      console.log('EditIngredientPage: batchPricing type:', typeof parsedBatchPricing, 'isArray:', Array.isArray(parsedBatchPricing));
    } catch (e) {
      console.error('EditIngredientPage: Error parsing batchPricing:', e, 'raw value:', ing.batchPricing);
      parsedBatchPricing = null;
    }
  } else {
    console.log('EditIngredientPage: No batchPricing found in database (null or undefined)');
    parsedBatchPricing = null; // Explicitly set to null
  }

  // Create a bound function for the IngredientForm
  const handleSubmit = handleIngredientUpdate.bind(null, id);

  // CRITICAL FIX: Next.js RSC serialization strips empty arrays []
  // We MUST ensure batchPricing is ALWAYS present with a non-empty structure
  // Use a sentinel object that Next.js won't strip (has non-zero/non-false values)
  const batchPricingValue = (parsedBatchPricing !== null && parsedBatchPricing !== undefined && Array.isArray(parsedBatchPricing) && parsedBatchPricing.length > 0 && !parsedBatchPricing[0]?._empty) 
    ? parsedBatchPricing 
    : [{ packQuantity: 1, packPrice: 0, _empty: true }] as any; // Use packQuantity: 1 instead of 0 to avoid being stripped
  
  // Build initialData object - use Object.defineProperty to force inclusion
  const initialFormDataBase = {
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
  
  // Force include batchPricing using Object.defineProperty with enumerable: true
  const initialFormData = Object.defineProperty(
    { ...initialFormDataBase },
    'batchPricing',
    {
      value: batchPricingValue,
      enumerable: true,
      writable: true,
      configurable: true,
    }
  );
  
  // Debug: Log what we're passing to the form
  console.log('EditIngredientPage: Passing initialData to IngredientForm:', JSON.stringify(initialFormData, null, 2));
  console.log('EditIngredientPage: batchPricing in initialData:', initialFormData.batchPricing, 'type:', typeof initialFormData.batchPricing, 'hasProperty:', 'batchPricing' in initialFormData, 'isArray:', Array.isArray(initialFormData.batchPricing));
  console.log('EditIngredientPage: initialFormData keys:', Object.keys(initialFormData));
  console.log('EditIngredientPage: batchPricing length:', Array.isArray(initialFormData.batchPricing) ? initialFormData.batchPricing.length : 'N/A');
  console.log('EditIngredientPage: batchPricing[0]:', Array.isArray(initialFormData.batchPricing) && initialFormData.batchPricing.length > 0 ? initialFormData.batchPricing[0] : 'N/A');
  console.log('EditIngredientPage: Object.getOwnPropertyDescriptor:', Object.getOwnPropertyDescriptor(initialFormData, 'batchPricing'));

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
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}


