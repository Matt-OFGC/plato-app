"use client";

import React from 'react';
import { PLATO_APPS, PlatoApp } from '@/lib/plato-apps-config';

interface AppSwitcherProps {
  activeApp: PlatoApp | null;
  onAppChange: (app: PlatoApp) => void;
  collapsed?: boolean;
  isHovered?: boolean;
  isTouchDevice?: boolean;
}

export function AppSwitcher({ 
  activeApp, 
  onAppChange, 
  collapsed = false, 
  isHovered = false,
  isTouchDevice = false 
}: AppSwitcherProps) {
  // Show labels when not collapsed or when hovered (same logic as navigation)
  const shouldShowLabels = isTouchDevice 
    ? !collapsed
    : (!collapsed || isHovered);

  return (
    <div className="space-y-1">
      {PLATO_APPS.map((app) => (
        <button
          key={app.id}
          onClick={() => onAppChange(app)}
          className={`group flex items-center gap-3 rounded-md px-2 transition-colors h-10 w-full ${
            activeApp?.id === app.id
              ? `${app.bgColor} ${app.textColor}`
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          title={app.description}
        >
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
            activeApp?.id === app.id ? app.textColor : 'text-gray-700'
          }`}>
            {app.icon}
          </div>
          <span className={`${
            shouldShowLabels ? 'opacity-100 w-auto' : 'opacity-0 w-0'
          } transition-all duration-300 text-sm font-medium whitespace-nowrap`}>
            {app.shortName}
          </span>
        </button>
      ))}
    </div>
  );
}