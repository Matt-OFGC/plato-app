"use client";

import React from "react";
import { ArrowRight, Lock } from "lucide-react";

interface UpgradeCardProps {
  title: string;
  description: string;
  tier: "professional" | "team" | "business";
  benefits?: string[];
  variant?: "default" | "compact" | "full";
  className?: string;
}

const tierInfo = {
  professional: {
    name: "Professional",
    price: "£19",
    badge: "Pro",
    color: "emerald",
  },
  team: {
    name: "Team",
    price: "£59",
    badge: "Team",
    color: "blue",
  },
  business: {
    name: "Business",
    price: "£149",
    badge: "Business",
    color: "purple",
  },
};

export function UpgradeCard({
  title,
  description,
  tier,
  benefits,
  variant = "default",
  className = "",
}: UpgradeCardProps) {
  const tierData = tierInfo[tier];

  if (variant === "compact") {
    return (
      <div
        className={`bg-gradient-to-br from-gray-50 to-white border-2 border-dashed border-gray-300 rounded-xl p-6 ${className}`}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
            <Lock className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600 mb-3">{description}</p>
            <a
              href={`/pricing?highlight=${tier}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Upgrade to {tierData.name} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-gray-300 transition-all ${className}`}
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-3">
          {tierData.badge}
        </span>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>

      {benefits && benefits.length > 0 && (
        <div className="mb-6">
          <ul className="space-y-2">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-3 text-sm text-gray-700">
                <svg
                  className="w-5 h-5 text-emerald-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {tierData.price}
          <span className="text-lg font-normal text-gray-600">/month</span>
        </div>
        <div className="text-sm text-gray-500">Billed monthly or save 20% annually</div>
      </div>

      <a
        href={`/pricing?highlight=${tier}`}
        className="block w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all text-center"
      >
        Upgrade to {tierData.name}
      </a>
      <a
        href="/pricing"
        className="block w-full text-center text-sm text-gray-600 hover:text-gray-900 mt-3"
      >
        Compare all plans
      </a>
    </div>
  );
}

