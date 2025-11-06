"use client";

import { useState } from "react";
import { getUnlockContent, FeatureModuleName } from "@/lib/unlock-content";

interface SectionUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleName: FeatureModuleName;
}

export function SectionUnlockModal({ isOpen, onClose, moduleName }: SectionUnlockModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const content = getUnlockContent(moduleName);

  const handleUnlock = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/features/unlock/${moduleName}`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to start checkout");
        return;
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Unlock error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">{content.icon}</div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
            {content.title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-center mb-6">{content.description}</p>

          {/* Price */}
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-gray-900">{content.price}</div>
            <div className="text-sm text-gray-500 mt-1">per month, cancel anytime</div>
          </div>

          {/* Benefits */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What's included:</h3>
            <ul className="space-y-3">
              {content.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0"
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
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleUnlock}
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              content.ctaText || "Unlock Now"
            )}
          </button>

          {/* Trial notice for Recipes */}
          {moduleName === "recipes" && (
            <p className="text-sm text-gray-500 text-center mt-4">
              You're currently on a free trial. Upgrade to unlock unlimited recipes and
              ingredients.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

