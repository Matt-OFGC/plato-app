"use client";

import React, { useState } from "react";
import { FeatureGateModal } from "./FeatureGateModal";

interface LockedNavItemProps {
  label: string;
  requiredTier: "professional" | "team" | "business";
  feature: string;
  benefits: string[];
  icon?: React.ReactNode;
  className?: string;
}

const tierBadges = {
  professional: { label: "Pro", color: "bg-emerald-100 text-emerald-700" },
  team: { label: "Team", color: "bg-blue-100 text-blue-700" },
  business: { label: "Business", color: "bg-purple-100 text-purple-700" },
};

export function LockedNavItem({
  label,
  requiredTier,
  feature,
  benefits,
  icon,
  className = "",
}: LockedNavItemProps) {
  const [showModal, setShowModal] = useState(false);
  const badge = tierBadges[requiredTier];

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 w-full group ${className}`}
      >
        {icon && <span className="text-gray-400">{icon}</span>}
        <span className="flex-1 text-left">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${badge.color}`}>
            {badge.label}
          </span>
          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </button>

      <FeatureGateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={feature}
        requiredTier={requiredTier}
        benefits={benefits}
      />
    </>
  );
}

