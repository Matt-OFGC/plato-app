import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateIngredient } from "../actions";

interface Props { params: { id: string } }

export default async function EditIngredientPage({ params }: Props) {
  const id = Number(params.id);
  const ing = await prisma.ingredient.findUnique({ where: { id } });
  if (!ing) return <div className="p-6">Not found</div>;

  async function action(formData: FormData) {
    "use server";
    await updateIngredient(id, formData);
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Edit Ingredient</h1>
      <form action={action} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input name="name" defaultValue={ing.name} className="w-full rounded border px-3 py-2" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Supplier</label>
          <input name="supplier" defaultValue={ing.supplier ?? ""} className="w-full rounded border px-3 py-2" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Pack Qty</label>
            <input type="number" step="any" name="packQuantity" defaultValue={Number(ing.packQuantity)} className="w-full rounded border px-3 py-2" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Pack Unit</label>
            <select name="packUnit" defaultValue={ing.packUnit} className="w-full rounded border px-3 py-2">
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="each">each</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Pack Price (GBP)</label>
            <input type="number" step="any" name="packPrice" defaultValue={Number(ing.packPrice)} className="w-full rounded border px-3 py-2" required />
          </div>
        </div>
        <input type="hidden" name="currency" value="GBP" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Density g/ml (optional)</label>
            <input type="number" step="any" name="densityGPerMl" defaultValue={ing.densityGPerMl == null ? "" : String(ing.densityGPerMl)} className="w-full rounded border px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Notes</label>
          <textarea name="notes" defaultValue={ing.notes ?? ""} className="w-full rounded border px-3 py-2" rows={3} />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Save</button>
          <Link href="/ingredients" className="text-blue-700 hover:underline">Back</Link>
        </div>
      </form>
    </div>
  );
}


