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
  // Get border color based on active app
  const getBorderColor = () => {
    if (!activeApp) return 'border-emerald-200';
    switch (activeApp.id) {
      case 'recipes': return 'border-emerald-200';
      case 'teams': return 'border-blue-200';
      case 'production': return 'border-purple-200';
      default: return 'border-emerald-200';
    }
  };

  const borderColor = getBorderColor();

  return (
    <div className="space-y-1">
      {PLATO_APPS.map((app) => {
        const isActive = activeApp?.id === app.id;
        return (
          <div key={app.id} className="relative group">
            <button
              onClick={() => onAppChange(app)}
              className={`w-10 h-10 rounded-lg border ${isActive ? borderColor : 'border-gray-200'} bg-white ${isActive ? app.textColor : 'text-gray-700'} ${isActive ? app.bgColor : 'hover:bg-gray-100'} active:bg-gray-100 transition-all duration-200 touch-manipulation flex items-center justify-center`}
              title={app.description}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className={`w-5 h-5 flex items-center justify-center ${
                isActive ? app.textColor : 'text-gray-700'
              }`}>
                {app.icon}
              </div>
            </button>
            
            {/* Desktop hover tooltip - styled like icon boxes */}
            {!isTouchDevice && (
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                <div className={`px-3 py-1.5 rounded-lg border ${borderColor} bg-white ${app.textColor} shadow-lg whitespace-nowrap text-sm font-medium`}>
                  {app.shortName}
                </div>
                {/* Tooltip arrow pointing left */}
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px]" style={{ borderRightColor: 'white' }}></div>
                <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-[1px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px]" style={{ borderRightColor: 'rgb(209 213 219)' }}></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}