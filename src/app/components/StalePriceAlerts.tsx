"use client";

interface StalePriceAlert {
  id: number;
  name: string;
  lastPriceUpdate: Date;
  packPrice: number;
  supplier?: string;
}

interface StalePriceAlertsProps {
  ingredients: StalePriceAlert[];
}

export function StalePriceAlerts({ ingredients }: StalePriceAlertsProps) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const staleIngredients = ingredients.filter(ingredient => {
    const lastUpdate = new Date(ingredient.lastPriceUpdate);
    return lastUpdate < thirtyDaysAgo;
  });

  if (staleIngredients.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Stale Price Alert
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              {staleIngredients.length} ingredient{staleIngredients.length !== 1 ? 's' : ''} have prices older than 30 days:
            </p>
            <ul className="mt-2 list-disc list-inside">
              {staleIngredients.slice(0, 5).map((ingredient) => (
                <li key={ingredient.id}>
                  {ingredient.name}
                  {ingredient.supplier && ` (${ingredient.supplier})`}
                </li>
              ))}
              {staleIngredients.length > 5 && (
                <li>... and {staleIngredients.length - 5} more</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
