"use client";

import { useState } from "react";

interface Company {
  id: number;
  name: string;
  country: string | null;
  businessType: string | null;
}

interface Recipe {
  id: number;
  name: string;
  allergens: any;
}

interface Ingredient {
  id: number;
  name: string;
  allergens: any;
}

interface Membership {
  id: number;
  role: string;
}

interface Props {
  company: Company;
  recipes: Recipe[];
  ingredients: Ingredient[];
  memberships: Membership[];
}

const COMMON_ALLERGENS = [
  "Gluten",
  "Dairy",
  "Eggs",
  "Nuts",
  "Peanuts",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
  "Sulphites",
];

export function ComplianceDashboard({
  company,
  recipes,
  ingredients,
  memberships,
}: Props) {
  const [selectedStandard, setSelectedStandard] = useState<string>("UK");

  // Calculate compliance metrics
  const recipesWithAllergens = recipes.filter(
    (r) => r.allergens && Object.keys(r.allergens).length > 0
  );
  const ingredientsWithAllergens = ingredients.filter(
    (i) => i.allergens && Object.keys(i.allergens).length > 0
  );

  const complianceScore = Math.round(
    ((recipesWithAllergens.length / Math.max(recipes.length, 1)) * 50 +
      (ingredientsWithAllergens.length / Math.max(ingredients.length, 1)) * 50)
  );

  const complianceIssues: string[] = [];
  if (recipes.length > 0 && recipesWithAllergens.length < recipes.length * 0.8) {
    complianceIssues.push(
      `${recipes.length - recipesWithAllergens.length} recipes missing allergen information`
    );
  }
  if (ingredients.length > 0 && ingredientsWithAllergens.length < ingredients.length * 0.8) {
    complianceIssues.push(
      `${ingredients.length - ingredientsWithAllergens.length} ingredients missing allergen information`
    );
  }
  if (!company.country) {
    complianceIssues.push("Company country not set (required for compliance)");
  }

  return (
    <div className="app-container">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
            <p className="text-gray-600 mt-2">{company.name}</p>
          </div>
          <a
            href={`/dashboard/companies/${company.id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Company
          </a>
        </div>
      </div>

      {/* Compliance Score */}
      <div
        className={`mb-8 rounded-xl p-6 ${
          complianceScore >= 80
            ? "bg-green-50 border border-green-200"
            : complianceScore >= 60
            ? "bg-yellow-50 border border-yellow-200"
            : "bg-red-50 border border-red-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Compliance Score</h2>
            <p className="text-gray-600 text-sm">
              {complianceScore >= 80
                ? "Your company is compliant"
                : complianceScore >= 60
                ? "Some areas need attention"
                : "Several compliance issues need to be addressed"}
            </p>
          </div>
          <div className="text-4xl font-bold text-gray-900">{complianceScore}%</div>
        </div>
      </div>

      {/* Standards Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Compliance Standards</h2>
        <div className="flex gap-4">
          {["UK", "EU", "US", "AU"].map((standard) => (
            <button
              key={standard}
              onClick={() => setSelectedStandard(standard)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStandard === standard
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {standard}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-4">
          {selectedStandard === "UK" &&
            "UK Food Information Regulations 2014 - Allergen labeling requirements"}
          {selectedStandard === "EU" &&
            "EU Food Information to Consumers Regulation - Allergen declaration"}
          {selectedStandard === "US" &&
            "FDA Food Allergen Labeling and Consumer Protection Act"}
          {selectedStandard === "AU" &&
            "Australia New Zealand Food Standards Code - Allergen requirements"}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-2xl font-bold text-gray-900">{recipes.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Recipes</div>
          <div className="text-xs text-gray-500 mt-2">
            {recipesWithAllergens.length} with allergen info
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-2xl font-bold text-gray-900">{ingredients.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Ingredients</div>
          <div className="text-xs text-gray-500 mt-2">
            {ingredientsWithAllergens.length} with allergen info
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-2xl font-bold text-gray-900">{memberships.length}</div>
          <div className="text-sm text-gray-600 mt-1">Team Members</div>
          <div className="text-xs text-gray-500 mt-2">
            {memberships.filter((m) => m.role === "OWNER" || m.role === "ADMIN").length} admins
          </div>
        </div>
      </div>

      {/* Issues */}
      {complianceIssues.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-red-900 mb-4">Compliance Issues</h2>
          <ul className="space-y-2">
            {complianceIssues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-red-700">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-3">
            <a
              href="/dashboard/recipes"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              Update Recipes
            </a>
            <a
              href="/dashboard/ingredients"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Update Ingredients
            </a>
          </div>
        </div>
      )}

      {/* Allergen Coverage */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Allergen Coverage</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {COMMON_ALLERGENS.map((allergen) => {
            const hasInRecipes = recipes.some(
              (r) => r.allergens && r.allergens[allergen.toLowerCase()]
            );
            const hasInIngredients = ingredients.some(
              (i) => i.allergens && i.allergens[allergen.toLowerCase()]
            );
            const hasCoverage = hasInRecipes || hasInIngredients;

            return (
              <div
                key={allergen}
                className={`p-4 rounded-lg border-2 ${
                  hasCoverage
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {hasCoverage ? (
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className="font-medium text-sm text-gray-900">{allergen}</span>
                </div>
                <div className="text-xs text-gray-600">
                  {hasCoverage ? "Tracked" : "Not tracked"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
