"use client";

import React from 'react';
import { PlatoApp } from '@/src/lib/plato-apps-config';
import { LockIcon } from './icons/PlatoAppIcons';

interface AppUpgradeModalProps {
  app: PlatoApp;
  isOpen: boolean;
  onClose: () => void;
}

const TIER_INFO = {
  professional: {
    name: 'Professional',
    price: { month: 19, year: 15 },
    description: 'Ideal for professional chefs and restaurants',
  },
  team: {
    name: 'Team',
    price: { month: 59, year: 47 },
    description: 'For growing food businesses with teams',
  },
  business: {
    name: 'Business',
    price: { month: 199, year: 159 },
    description: 'For large hospitality operations',
  },
};

export function AppUpgradeModal({ app, isOpen, onClose }: AppUpgradeModalProps) {
  if (!isOpen) return null;

  const tierInfo = TIER_INFO[app.requiredTier];

  const handleUpgrade = () => {
    window.location.href = '/pricing';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              {app.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{app.name}</h2>
              <p className="text-emerald-100 text-sm">Premium App</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <LockIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upgrade Required
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {app.description}
            </p>
            <p className="text-sm text-gray-500">
              Available with {tierInfo.name} plan and above
            </p>
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                £{tierInfo.price.year}
                <span className="text-sm font-normal text-gray-500">/month</span>
              </div>
              <div className="text-sm text-gray-600">billed annually</div>
              <div className="text-xs text-gray-500 mt-1">
                or £{tierInfo.price.month}/month
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">What you'll get:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Access to {app.name}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                All previous tier features
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Priority support
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Advanced integrations
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgrade}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
