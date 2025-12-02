"use client";

import { selectAllOnFocus } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
}

interface ShelfLifeOption {
  id: number;
  name: string;
}

interface StorageOption {
  id: number;
  name: string;
}

interface RecipeFormDetailsProps {
  categories: Category[];
  shelfLifeOptions: ShelfLifeOption[];
  storageOptions: StorageOption[];
  categoryId: string;
  shelfLifeId: string;
  storageId: string;
  bakeTime: string;
  bakeTemp: string;
  useSections: boolean;
  isWholesaleProduct: boolean;
  wholesalePrice: string;
  yieldUnit: string;
  onCategoryChange: (value: string) => void;
  onShelfLifeChange: (value: string) => void;
  onStorageChange: (value: string) => void;
  onBakeTimeChange: (value: string) => void;
  onBakeTempChange: (value: string) => void;
  onWholesaleToggle: (checked: boolean) => void;
  onWholesalePriceChange: (value: string) => void;
}

export function RecipeFormDetails({
  categories,
  shelfLifeOptions,
  storageOptions,
  categoryId,
  shelfLifeId,
  storageId,
  bakeTime,
  bakeTemp,
  useSections,
  isWholesaleProduct,
  wholesalePrice,
  yieldUnit,
  onCategoryChange,
  onShelfLifeChange,
  onStorageChange,
  onBakeTimeChange,
  onBakeTempChange,
  onWholesaleToggle,
  onWholesalePriceChange,
}: RecipeFormDetailsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">Details</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Category</label>
          <div className="relative">
            <select
              value={categoryId}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-4 py-3 pr-10 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white hover:bg-white transition-all cursor-pointer appearance-none"
            >
              <option value="" className="text-gray-400">None</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} className="text-gray-900">{cat.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Shelf Life</label>
          <div className="relative">
            <select
              value={shelfLifeId}
              onChange={(e) => onShelfLifeChange(e.target.value)}
              className="w-full px-4 py-3 pr-10 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white hover:bg-white transition-all cursor-pointer appearance-none"
            >
              <option value="" className="text-gray-400">None</option>
              {shelfLifeOptions.map(opt => (
                <option key={opt.id} value={opt.id} className="text-gray-900">{opt.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Storage</label>
          <div className="relative">
            <select
              value={storageId}
              onChange={(e) => onStorageChange(e.target.value)}
              className="w-full px-4 py-3 pr-10 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white hover:bg-white transition-all cursor-pointer appearance-none"
            >
              <option value="" className="text-gray-400">None</option>
              {storageOptions.map(opt => (
                <option key={opt.id} value={opt.id} className="text-gray-900">{opt.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Wholesale Product Section */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="isWholesaleProduct"
              checked={isWholesaleProduct}
              onChange={(e) => onWholesaleToggle(e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="isWholesaleProduct" className="flex items-center gap-2 cursor-pointer">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold text-gray-700">Wholesale Product</span>
            </label>
          </div>
          
          {isWholesaleProduct && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Wholesale Price Per Unit</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={wholesalePrice}
                  onFocus={selectAllOnFocus}
                  onChange={(e) => onWholesalePriceChange(e.target.value)}
                  placeholder="Per slice/unit"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Price per {yieldUnit}
              </p>
            </div>
          )}
        </div>
        
        {/* Baking Section */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
            Baking Details
          </h4>
          <div className="space-y-4">
            {!useSections && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Bake Temperature</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={bakeTemp}
                      onChange={(e) => onBakeTempChange(e.target.value)}
                      placeholder="e.g. 180"
                      className="w-full px-3 py-2 pr-12 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">°C</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Bake Time</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={bakeTime}
                      onChange={(e) => onBakeTimeChange(e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full px-3 py-2 pr-12 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">min</span>
                  </div>
                </div>
              </>
            )}
            {useSections && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Using Sections:</strong> Add bake times to individual sections below. The total cooking time will be calculated automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




