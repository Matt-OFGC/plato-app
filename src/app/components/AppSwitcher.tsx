"use client";

import React from 'react';
import { PLATO_APPS, PlatoApp } from '@/lib/plato-apps-config';

interface AppSwitcherProps {
  activeApp: PlatoApp | null;
  onAppChange: (app: PlatoApp) => void;
}

export function AppSwitcher({ activeApp, onAppChange }: AppSwitcherProps) {
  return (
    <div className="mb-6">
      <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
        {PLATO_APPS.map((app) => (
          <button
            key={app.id}
            onClick={() => onAppChange(app)}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeApp?.id === app.id
                ? `${app.bgColor} ${app.textColor} ${app.borderColor} border shadow-sm`
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
            title={app.description}
          >
            {app.icon}
            <span className="hidden sm:inline">{app.shortName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}