import { getMockRecipeById } from "@/lib/mocks/recipe";
import { formatQty } from "@/lib/recipe-scaling";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecipePrintPage({ params }: Props) {
  const { id } = await params;
  const recipe = await getMockRecipeById(id);

  return (
    <div className="max-w-4xl mx-auto p-8 print:p-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
        <p className="text-gray-600">
          {recipe.category} • {recipe.baseServings} slices
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-4 text-emerald-700">Ingredients</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing) => (
              <li key={ing.id} className="flex gap-3">
                <span className="font-semibold min-w-[80px]">
                  {formatQty(ing.quantity, ing.unit)}
                </span>
                <span>{ing.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 text-blue-700">Instructions</h2>
          {recipe.steps.map((step, idx) => (
            <div key={step.id} className="mb-4">
              <h3 className="font-bold mb-2">{step.title}</h3>
              {step.temperatureC && (
                <p className="text-sm text-gray-600">Temperature: {step.temperatureC}°C</p>
              )}
              {step.durationMin && (
                <p className="text-sm text-gray-600 mb-2">Duration: {step.durationMin} minutes</p>
              )}
              <ol className="list-decimal list-inside space-y-1">
                {step.instructions.map((instruction, i) => (
                  <li key={i} className="text-sm">{instruction}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      {recipe.notes && (
        <div className="border-t pt-4">
          <h3 className="font-bold mb-2">Notes</h3>
          <p className="text-sm text-gray-700">{recipe.notes}</p>
        </div>
      )}
    </div>
  );
}

