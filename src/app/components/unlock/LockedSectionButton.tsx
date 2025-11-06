"use client";

import { useState } from "react";
import { SectionUnlockModal } from "./SectionUnlockModal";
import { FeatureModuleName } from "@/lib/stripe-features";

interface LockedSectionButtonProps {
  moduleName: FeatureModuleName;
  label: string;
  className?: string;
  icon?: React.ReactNode;
}

export function LockedSectionButton({
  moduleName,
  label,
  className = "",
  icon,
}: LockedSectionButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 uppercase tracking-wider transition-colors ${className}`}
      >
        <span>{label}</span>
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </button>

      <SectionUnlockModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        moduleName={moduleName}
      />
    </>
  );
}

