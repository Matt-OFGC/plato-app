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

  // Build initialData object - ensure batchPricing is ALWAYS included as a required property
  // CRITICAL FIX: Next.js might strip null/undefined during serialization
  // Use a sentinel object with a marker property to ensure it's always serialized
  const batchPricingValue = (parsedBatchPricing !== null && parsedBatchPricing !== undefined && Array.isArray(parsedBatchPricing) && parsedBatchPricing.length > 0) 
    ? parsedBatchPricing 
    : []; // Use empty array - ensure it's always an array, never null/undefined
  
  // Build object with batchPricing as a required property
  // Use Object.assign to ensure property exists even if value is empty
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
  
  // Force include batchPricing using Object.assign to ensure it's never stripped
  const initialFormData = Object.assign({}, initialFormDataBase, {
    batchPricing: batchPricingValue,
  });
  
  // Debug: Log what we're passing to the form
  console.log('EditIngredientPage: Passing initialData to IngredientForm:', JSON.stringify(initialFormData, null, 2));
  console.log('EditIngredientPage: batchPricing in initialData:', initialFormData.batchPricing, 'type:', typeof initialFormData.batchPricing, 'hasProperty:', 'batchPricing' in initialFormData, 'isArray:', Array.isArray(initialFormData.batchPricing));
  console.log('EditIngredientPage: initialFormData keys:', Object.keys(initialFormData));
  console.log('EditIngredientPage: initialFormData.batchPricing === null:', initialFormData.batchPricing === null);
  console.log('EditIngredientPage: initialFormData.batchPricing === undefined:', initialFormData.batchPricing === undefined);
  console.log('EditIngredientPage: initialFormData.batchPricing value:', initialFormData.batchPricing);

  // CRITICAL FIX: Next.js RSC serialization strips empty arrays/null
  // We need to ensure batchPricing is always present with a non-empty value
  // Use a sentinel object when empty to ensure serialization
  const finalInitialData = {
    ...initialFormData,
    // Force include batchPricing - if empty, use a sentinel array with a marker
    batchPricing: initialFormData.batchPricing.length > 0 
      ? initialFormData.batchPricing 
      : [{ packQuantity: 0, packPrice: 0, _empty: true }] as any, // Sentinel to ensure serialization
  };
  
  // Remove the sentinel marker after serialization if needed
  if (finalInitialData.batchPricing.length === 1 && (finalInitialData.batchPricing[0] as any)._empty) {
    // This will be handled client-side
  }
  
  console.log('EditIngredientPage: Final initialData before passing:', JSON.stringify(finalInitialData, null, 2));
  console.log('EditIngredientPage: Final initialData keys:', Object.keys(finalInitialData));
  console.log('EditIngredientPage: batchPricing in final:', finalInitialData.batchPricing, 'hasProperty:', 'batchPricing' in finalInitialData);

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
          initialData={finalInitialData}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}


