"use client";

import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

interface AllergenSheetTemplate {
  id: number;
  templateName: string;
  layoutType: string;
  backgroundColor: string;
  textColor: string;
  accentColor?: string;
  headerFont: string;
  headerFontSize: number;
  headerFontWeight: string;
  bodyFont: string;
  bodyFontSize: number;
  bodyFontWeight: string;
  showIcons: boolean;
  showAllergenCodes: boolean;
  showDietaryInfo: boolean;
  showWarnings: boolean;
  showCompanyInfo: boolean;
  gridColumns: number;
}

interface Recipe {
  id: number;
  name: string;
  allergens?: string[];
  dietary_tags?: string[];
  category?: string;
}

interface AllergenSheetCanvasProps {
  template: AllergenSheetTemplate;
  recipes: Recipe[];
}

const COMMON_ALLERGENS = [
  'Gluten',
  'Dairy',
  'Eggs',
  'Nuts',
  'Peanuts',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
  'Mustard',
  'Celery',
  'Lupin',
  'Sulphites',
  'Molluscs'
];

export function AllergenSheetCanvas({ template, recipes }: AllergenSheetCanvasProps) {

  // Render "Full Detail" layout
  const renderDetailedLayout = () => {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center border-b-2 pb-6" style={{ borderColor: template.accentColor || template.textColor }}>
          <h1
            style={{
              fontFamily: template.headerFont,
              fontSize: `${template.headerFontSize}px`,
              fontWeight: template.headerFontWeight,
              color: template.textColor
            }}
          >
            Allergen Information
          </h1>
          {template.showCompanyInfo && (
            <p className="text-sm mt-2" style={{ color: template.textColor, opacity: 0.7 }}>
              Plato Bakery • Updated {new Date().toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Recipes */}
        {recipes.map(recipe => {
          const recipeAllergens = recipe.allergens || [];

          return (
            <div key={recipe.id} className="border-b pb-6 last:border-b-0">
              {/* Recipe Name */}
              <h2
                className="mb-4"
                style={{
                  fontFamily: template.headerFont,
                  fontSize: `${template.headerFontSize - 6}px`,
                  fontWeight: '600',
                  color: template.textColor
                }}
              >
                {recipe.name}
              </h2>

              {/* Allergen List */}
              <div className="grid grid-cols-2 gap-3">
                {COMMON_ALLERGENS.map(allergen => {
                  const hasAllergen = recipeAllergens.some(a =>
                    a.toLowerCase().includes(allergen.toLowerCase())
                  );

                  return (
                    <div
                      key={allergen}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        hasAllergen ? 'bg-red-50' : 'bg-gray-50'
                      }`}
                    >
                      {template.showIcons && (
                        hasAllergen ? (
                          <AlertTriangle size={16} className="text-red-600" />
                        ) : (
                          <Check size={16} className="text-green-600" />
                        )
                      )}
                      <span
                        style={{
                          fontFamily: template.bodyFont,
                          fontSize: `${template.bodyFontSize}px`,
                          fontWeight: template.bodyFontWeight,
                          color: hasAllergen ? '#DC2626' : template.textColor
                        }}
                      >
                        {allergen}
                      </span>
                      {hasAllergen && template.showAllergenCodes && (
                        <span className="ml-auto text-xs font-bold text-red-600">
                          YES
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dietary Info */}
              {template.showDietaryInfo && recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {recipe.dietary_tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: template.accentColor || '#E5E7EB',
                        color: template.textColor
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Warning Footer */}
        {template.showWarnings && (
          <div className="mt-8 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 text-sm">Cross-Contamination Warning</p>
                <p className="text-xs text-yellow-800 mt-1">
                  All products are prepared in a facility that handles nuts, dairy, gluten, and other allergens.
                  Please inform staff of any allergies before ordering.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render "Simple Reference" layout
  const renderSimpleLayout = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center border-b-2 pb-4" style={{ borderColor: template.accentColor || template.textColor }}>
          <h1
            style={{
              fontFamily: template.headerFont,
              fontSize: `${template.headerFontSize}px`,
              fontWeight: template.headerFontWeight,
              color: template.textColor
            }}
          >
            Allergen Reference
          </h1>
          {template.showCompanyInfo && (
            <p className="text-xs mt-2" style={{ color: template.textColor, opacity: 0.7 }}>
              {new Date().toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Simple Table */}
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: template.accentColor || '#F3F4F6' }}>
              <th className="text-left p-3 font-semibold" style={{ color: template.textColor }}>
                Product
              </th>
              {COMMON_ALLERGENS.slice(0, 8).map(allergen => (
                <th key={allergen} className="text-center p-2 text-xs" style={{ color: template.textColor }}>
                  {allergen.substring(0, 3).toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recipes.map((recipe, idx) => (
              <tr key={recipe.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-3 font-medium" style={{ color: template.textColor }}>
                  {recipe.name}
                </td>
                {COMMON_ALLERGENS.slice(0, 8).map(allergen => {
                  const hasAllergen = (recipe.allergens || []).some(a =>
                    a.toLowerCase().includes(allergen.toLowerCase())
                  );
                  return (
                    <td key={allergen} className="text-center p-2">
                      {hasAllergen ? (
                        <Check size={16} className="mx-auto text-red-600" />
                      ) : (
                        <X size={16} className="mx-auto text-gray-300" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {template.showWarnings && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-xs text-yellow-800">
            <p><strong>Warning:</strong> Prepared in a facility that handles all major allergens.</p>
          </div>
        )}
      </div>
    );
  };

  // Render "Visual Matrix" layout
  const renderMatrixLayout = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center border-b-2 pb-4" style={{ borderColor: template.accentColor || template.textColor }}>
          <h1
            style={{
              fontFamily: template.headerFont,
              fontSize: `${template.headerFontSize}px`,
              fontWeight: template.headerFontWeight,
              color: template.textColor
            }}
          >
            Allergen Matrix
          </h1>
        </div>

        {/* Matrix Grid */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${template.gridColumns}, 1fr)` }}>
          {recipes.map(recipe => {
            const recipeAllergens = recipe.allergens || [];

            return (
              <div
                key={recipe.id}
                className="border-2 rounded-xl p-4"
                style={{ borderColor: template.accentColor || '#E5E7EB' }}
              >
                {/* Recipe Name */}
                <h3
                  className="font-semibold mb-3 text-center"
                  style={{
                    fontFamily: template.headerFont,
                    fontSize: `${template.bodyFontSize + 2}px`,
                    color: template.textColor
                  }}
                >
                  {recipe.name}
                </h3>

                {/* Allergen Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {COMMON_ALLERGENS.slice(0, 9).map(allergen => {
                    const hasAllergen = recipeAllergens.some(a =>
                      a.toLowerCase().includes(allergen.toLowerCase())
                    );

                    return (
                      <div
                        key={allergen}
                        className={`text-center px-2 py-2 rounded text-xs ${
                          hasAllergen ? 'bg-red-100 text-red-800 font-semibold' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {allergen.substring(0, 3).toUpperCase()}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {template.showWarnings && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-xs text-center text-yellow-800">
            Cross-contamination possible. All products prepared in shared facility.
          </div>
        )}
      </div>
    );
  };

  // Main render
  return (
    <div
      className="w-full h-full p-8"
      style={{
        backgroundColor: template.backgroundColor,
        fontFamily: template.bodyFont
      }}
    >
      {template.layoutType === 'detailed' && renderDetailedLayout()}
      {template.layoutType === 'simple' && renderSimpleLayout()}
      {template.layoutType === 'matrix' && renderMatrixLayout()}
    </div>
  );
}
