"use client";

interface RecipeCostDisplayProps {
  recipeName: string;
  totalCost: number;
  portionsPerBatch: number;
  currency?: string;
  sellingPrice?: number | null;
}

export function RecipeCostDisplay({
  recipeName,
  totalCost,
  portionsPerBatch,
  currency = "GBP",
  sellingPrice,
}: RecipeCostDisplayProps) {
  const isSingleServing = portionsPerBatch === 1;
  const costPerServing = totalCost / portionsPerBatch;
  
  // Calculate profit margins if selling price is set
  const profitPerServing = sellingPrice ? sellingPrice - costPerServing : null;
  const profitMargin = sellingPrice ? ((profitPerServing! / sellingPrice) * 100) : null;
  const suggestedPrice = costPerServing * 3; // 3x markup = 66% margin

  const currencySymbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : "€";

  return (
    <div className="space-y-4">
      {/* Main Cost Breakdown */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border-2 border-emerald-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Cost Breakdown
        </h3>

        {isSingleServing ? (
          /* Single Serving Display */
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-emerald-200">
              <p className="text-sm text-gray-600 mb-1">Cost per {recipeName.toLowerCase()}</p>
              <p className="text-3xl font-bold text-emerald-600">
                {currencySymbol}{totalCost.toFixed(2)}
              </p>
            </div>
          </div>
        ) : (
          /* Batch Recipe Display */
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-emerald-200">
              <p className="text-sm text-gray-600 mb-1">Total batch cost</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencySymbol}{totalCost.toFixed(2)}
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <span className="text-sm">Divided by {portionsPerBatch} servings</span>
            </div>

            <div className="bg-emerald-600 text-white rounded-lg p-4">
              <p className="text-sm opacity-90 mb-1">Cost per serving</p>
              <p className="text-3xl font-bold">
                {currencySymbol}{costPerServing.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Guidance */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Pricing Guide
        </h3>

        {sellingPrice ? (
          /* Current Pricing */
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Current selling price</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencySymbol}{sellingPrice.toFixed(2)}
              </p>
            </div>

            {profitPerServing && profitMargin && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-gray-600 mb-1">Profit per serving</p>
                  <p className="text-lg font-bold text-green-600">
                    {currencySymbol}{profitPerServing.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-gray-600 mb-1">Profit margin</p>
                  <p className={`text-lg font-bold ${
                    profitMargin >= 60 ? "text-green-600" : 
                    profitMargin >= 40 ? "text-yellow-600" : 
                    "text-red-600"
                  }`}>
                    {profitMargin.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}

            {profitMargin && profitMargin < 50 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  💡 Consider increasing price to {currencySymbol}{suggestedPrice.toFixed(2)} for a healthier margin
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Suggested Pricing */
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Based on your cost of <strong>{currencySymbol}{costPerServing.toFixed(2)}</strong> per serving:
            </p>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-lg p-3 border border-blue-200 text-center">
                <p className="text-xs text-gray-600 mb-1">Conservative</p>
                <p className="text-sm font-bold text-gray-900">
                  {currencySymbol}{(costPerServing * 2).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">50% margin</p>
              </div>
              
              <div className="bg-blue-600 text-white rounded-lg p-3 border-2 border-blue-700 text-center">
                <p className="text-xs opacity-90 mb-1">Recommended</p>
                <p className="text-sm font-bold">
                  {currencySymbol}{suggestedPrice.toFixed(2)}
                </p>
                <p className="text-xs opacity-80">66% margin</p>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-blue-200 text-center">
                <p className="text-xs text-gray-600 mb-1">Premium</p>
                <p className="text-sm font-bold text-gray-900">
                  {currencySymbol}{(costPerServing * 4).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">75% margin</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 text-center">
              Target 60-70% profit margin for food businesses
            </p>
          </div>
        )}
      </div>

      {/* Quick Summary for Batch Recipes */}
      {!isSingleServing && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2 text-sm">📊 Quick Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Makes:</p>
              <p className="font-semibold">{portionsPerBatch} servings</p>
            </div>
            <div>
              <p className="text-gray-600">Each serving costs:</p>
              <p className="font-semibold">{currencySymbol}{costPerServing.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

