"use client";

import React from "react";

interface FeatureComparisonTableProps {
  currentTier: "starter" | "professional" | "team" | "business";
  onUpgrade?: (tier: "professional" | "team" | "business") => void;
}

const tiers = [
  {
    id: "starter",
    name: "Starter",
    price: "Free",
    priceAnnual: "Free",
  },
  {
    id: "professional",
    name: "Professional",
    price: "£30",
    priceAnnual: "£25",
  },
  {
    id: "team",
    name: "Team",
    price: "£59",
    priceAnnual: "£47",
  },
  {
    id: "business",
    name: "Business",
    price: "£149",
    priceAnnual: "£119",
  },
] as const;

const features = [
  {
    category: "Core Features",
    items: [
      { name: "Ingredients", values: ["10", "Unlimited", "Unlimited", "Unlimited"] },
      { name: "Recipes", values: ["2", "Unlimited", "Unlimited", "Unlimited"] },
      { name: "Cost calculations", values: [true, true, true, true] },
      { name: "Recipe scaling", values: [false, true, true, true] },
    ],
  },
  {
    category: "Advanced Features",
    items: [
      { name: "PDF export", values: [false, true, true, true] },
      { name: "Analytics", values: [false, true, true, true] },
      { name: "Inventory tracking", values: [false, true, true, true] },
      { name: "Advanced analytics", values: [false, false, false, true] },
    ],
  },
  {
    category: "Team & Collaboration",
    items: [
      { name: "Team seats", values: ["1", "1", "5 included", "Unlimited"] },
      { name: "Production planning", values: [false, false, true, true] },
      { name: "Device/PIN login", values: [false, false, true, true] },
    ],
  },
  {
    category: "Business Features",
    items: [
      { name: "Wholesale management", values: [false, false, false, true] },
      { name: "Customer portal", values: [false, false, false, true] },
    ],
  },
  {
    category: "Support",
    items: [
      { name: "Support", values: ["Community", "Priority", "Priority", "Dedicated"] },
    ],
  },
];

export function FeatureComparisonTable({
  currentTier,
  onUpgrade,
}: FeatureComparisonTableProps) {
  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    return <span className="text-sm text-gray-700">{value}</span>;
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left p-4 font-semibold text-gray-900">Features</th>
            {tiers.map((tier) => (
              <th
                key={tier.id}
                className={`p-4 text-center ${
                  currentTier === tier.id ? "bg-emerald-50" : ""
                }`}
              >
                <div className="font-bold text-gray-900">{tier.name}</div>
                <div className="text-sm text-gray-600 mt-1">{tier.price}/mo</div>
                {tier.priceAnnual !== tier.price && (
                  <div className="text-xs text-gray-500">({tier.priceAnnual}/mo annual)</div>
                )}
                {currentTier === tier.id && (
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 bg-emerald-600 text-white text-xs font-semibold rounded">
                      Current Plan
                    </span>
                  </div>
                )}
                {tier.id !== "starter" && currentTier !== tier.id && onUpgrade && (
                  <button
                    onClick={() => onUpgrade(tier.id as "professional" | "team" | "business")}
                    className="mt-2 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-semibold rounded hover:shadow-md transition-all"
                  >
                    Upgrade
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((category, categoryIndex) => (
            <React.Fragment key={categoryIndex}>
              <tr className="bg-gray-50">
                <td colSpan={5} className="p-4 font-semibold text-gray-900 text-sm">
                  {category.category}
                </td>
              </tr>
              {category.items.map((feature, featureIndex) => (
                <tr key={featureIndex} className="border-b border-gray-100">
                  <td className="p-4 text-sm text-gray-700">{feature.name}</td>
                  {feature.values.map((value, tierIndex) => (
                    <td
                      key={tierIndex}
                      className={`p-4 text-center ${
                        currentTier === tiers[tierIndex].id ? "bg-emerald-50/50" : ""
                      }`}
                    >
                      {renderFeatureValue(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

