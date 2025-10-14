"use client";

import React, { useState } from "react";
import { Lock } from "lucide-react";
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
          <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
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

