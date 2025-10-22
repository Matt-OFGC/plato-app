import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateIngredient } from "../actions";
import { fromBase, Unit } from "@/lib/units";
import { IngredientForm } from "../../../components/IngredientForm";
import { getCurrentUserAndCompany } from "@/lib/current";

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
  const originalUnit = ing.originalUnit || ing.packUnit;
  const originalQuantity = ing.originalUnit 
    ? fromBase(Number(ing.packQuantity), originalUnit as Unit, ing.densityGPerMl ? Number(ing.densityGPerMl) : undefined)
    : Number(ing.packQuantity);

  // Create a bound function for the IngredientForm
  const handleSubmit = handleIngredientUpdate.bind(null, id);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Ingredient</h1>
        <p className="text-gray-600 mt-2">Update ingredient details and pricing</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <IngredientForm
          companyId={companyId || undefined}
          suppliers={suppliers}
          initialData={{
            name: ing.name,
            supplierId: ing.supplierId || undefined,
            packQuantity: originalQuantity,
            packUnit: ing.originalUnit || ing.packUnit,
            customConversions: ing.customConversions || undefined,
            packPrice: Number(ing.packPrice),
            densityGPerMl: ing.densityGPerMl ? Number(ing.densityGPerMl) : undefined,
            notes: ing.notes || "",
            allergens: ing.allergens || []
          }}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}


