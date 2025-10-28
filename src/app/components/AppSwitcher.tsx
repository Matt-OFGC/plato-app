"use client";

import React, { useState, useRef, useEffect } from 'react';
import { PLATO_APPS, canAccessApp, PlatoApp } from '@/src/lib/plato-apps-config';
import { LockIcon } from './icons/PlatoAppIcons';
import { AppUpgradeModal } from './AppUpgradeModal';
import { useAppContext } from './AppContextProvider';

interface AppSwitcherProps {
  userTier: string;
  collapsed?: boolean;
}

export function AppSwitcher({ userTier, collapsed = false }: AppSwitcherProps) {
  const [selectedApp, setSelectedApp] = useState<PlatoApp | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { activeApp, switchToApp } = useAppContext();

  const availableApps = PLATO_APPS.filter(app => canAccessApp(app.id, userTier));
  const lockedApps = PLATO_APPS.filter(app => !canAccessApp(app.id, userTier));

  const handleAppClick = (app: PlatoApp) => {
    if (canAccessApp(app.id, userTier)) {
      switchToApp(app.id);
      window.location.href = app.route;
    } else {
      setSelectedApp(app);
      setShowUpgradeModal(true);
    }
  };

  const getAppTileClasses = (app: PlatoApp, isLocked: boolean) => {
    const baseClasses = "group relative w-16 h-16 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center";
    const activeClasses = activeApp?.id === app.id ? "ring-2 ring-emerald-500 ring-offset-2 bg-emerald-50" : "";
    const lockedClasses = isLocked ? "opacity-60" : "hover:bg-gray-50";
    
    return `${baseClasses} ${activeClasses} ${lockedClasses}`;
  };

  const getAppIconClasses = (app: PlatoApp, isLocked: boolean) => {
    const baseClasses = "w-6 h-6 transition-colors";
    const activeClasses = activeApp?.id === app.id ? "text-emerald-600" : "text-gray-600";
    const lockedClasses = isLocked ? "text-gray-400" : "group-hover:text-gray-800";
    
    return `${baseClasses} ${activeClasses} ${lockedClasses}`;
  };

  return (
    <>
      <div className="px-2 mb-4">
        {/* App Switcher Container */}
        <div 
          ref={scrollContainerRef}
          className={`overflow-y-auto scrollbar-hide ${collapsed ? 'max-h-20' : 'max-h-80'}`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="space-y-2">
            {/* Available Apps */}
            {availableApps.map((app) => (
              <div key={app.id} className="relative">
                <div
                  className={getAppTileClasses(app, false)}
                  onClick={() => handleAppClick(app)}
                  title={collapsed ? app.shortName : app.description}
                >
                  <div className={getAppIconClasses(app, false)}>
                    {app.icon}
                  </div>
                  
                  {/* Active indicator */}
                  {activeApp?.id === app.id && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </div>
                
                {/* App name (only when not collapsed) */}
                {!collapsed && (
                  <div className="text-center mt-1">
                    <span className="text-xs text-gray-600 font-medium">
                      {app.shortName}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Locked Apps */}
            {lockedApps.map((app) => (
              <div key={app.id} className="relative">
                <div
                  className={getAppTileClasses(app, true)}
                  onClick={() => handleAppClick(app)}
                  title={collapsed ? `${app.shortName} (Locked)` : `${app.description} - Upgrade Required`}
                >
                  <div className={getAppIconClasses(app, true)}>
                    {app.icon}
                  </div>
                  
                  {/* Lock overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 bg-gray-800/80 rounded-full flex items-center justify-center">
                      <LockIcon className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* App name (only when not collapsed) */}
                {!collapsed && (
                  <div className="text-center mt-1">
                    <span className="text-xs text-gray-400 font-medium">
                      {app.shortName}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicators (only when not collapsed and there are many apps) */}
        {!collapsed && (availableApps.length + lockedApps.length) > 4 && (
          <>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-gradient-to-b from-white to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          </>
        )}
      </div>

      {/* Upgrade Modal */}
      <AppUpgradeModal
        app={selectedApp!}
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          setSelectedApp(null);
        }}
      />
    </>
  );
}
