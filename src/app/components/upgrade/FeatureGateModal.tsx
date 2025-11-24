"use client";

import React from "react";

interface FeatureGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  requiredTier?: "mvp";
  benefits: string[];
  previewImage?: string;
}

const tierInfo = {
  mvp: {
    name: "Plato MVP",
    price: "£19.99",
    color: "emerald",
  },
};

export function FeatureGateModal({
  isOpen,
  onClose,
  feature,
  requiredTier = "mvp",
  benefits,
  previewImage,
}: FeatureGateModalProps) {
  if (!isOpen) return null;

  const tier = tierInfo[requiredTier];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Preview Image (if provided) */}
        {previewImage && (
          <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100">
            <img
              src={previewImage}
              alt={feature}
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🔒</div>
                <h3 className="text-2xl font-bold text-gray-900">{feature}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="p-8">
          {!previewImage && (
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🔒</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{feature}</h3>
            </div>
          )}

          <div className="text-center mb-6">
            <p className="text-lg text-gray-600">
              Unlock this feature with the <span className="font-semibold text-gray-900">{tier.name}</span> plan
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">What you'll get:</h4>
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
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

          {/* Pricing */}
          <div className="text-center mb-6">
            <div className="text-sm text-gray-600 mb-2">Starting at</div>
            <div className="flex items-baseline justify-center gap-2 mb-1">
              <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
              <span className="text-gray-600">/month</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-3">
            <a
              href={`/pricing?highlight=${requiredTier}`}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all text-center"
            >
              Upgrade to {tier.name}
            </a>
            <a
              href="/pricing"
              className="px-6 py-3 rounded-xl font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              View All Plans
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

