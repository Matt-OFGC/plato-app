"use client";

import React, { useState } from "react";

interface UpgradeBannerProps {
  message: string;
  tier: "professional" | "team" | "business";
  dismissible?: boolean;
  storageKey?: string;
  className?: string;
}

const tierInfo = {
  professional: { name: "Professional", color: "emerald" },
  team: { name: "Team", color: "blue" },
  business: { name: "Business", color: "purple" },
};

export function UpgradeBanner({
  message,
  tier,
  dismissible = true,
  storageKey,
  className = "",
}: UpgradeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== "undefined" && storageKey) {
      return localStorage.getItem(`banner_dismissed_${storageKey}`) === "true";
    }
    return false;
  });

  const tierData = tierInfo[tier];

  const handleDismiss = () => {
    setIsDismissed(true);
    if (storageKey && typeof window !== "undefined") {
      localStorage.setItem(`banner_dismissed_${storageKey}`, "true");
    }
  };

  if (isDismissed) return null;

  return (
    <div
      className={`bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-4 ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 text-2xl">💡</div>
        <div className="flex-1">
          <p className="text-sm text-gray-700">{message}</p>
        </div>
        <a
          href={`/pricing?highlight=${tier}`}
          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold rounded-lg hover:shadow-md transition-all"
        >
          Upgrade to {tierData.name}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-white/50 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

