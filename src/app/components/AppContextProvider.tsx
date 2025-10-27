"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getAppByRoute, getAppById, PlatoApp } from '@/src/lib/plato-apps-config';

interface AppContextType {
  activeApp: PlatoApp | null;
  setActiveApp: (app: PlatoApp | null) => void;
  switchToApp: (appId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [activeApp, setActiveApp] = useState<PlatoApp | null>(null);
  const pathname = usePathname();

  // Auto-detect app from current route
  useEffect(() => {
    const detectedApp = getAppByRoute(pathname);
    if (detectedApp) {
      setActiveApp(detectedApp);
      // Persist to localStorage
      try {
        localStorage.setItem('plato_active_app', detectedApp.id);
      } catch {}
    }
  }, [pathname]);

  // Load persisted app on mount
  useEffect(() => {
    try {
      const savedAppId = localStorage.getItem('plato_active_app');
      if (savedAppId && !activeApp) {
        const savedApp = getAppById(savedAppId);
        if (savedApp) {
          setActiveApp(savedApp);
        }
      }
    } catch {}
  }, [activeApp]);

  const switchToApp = (appId: string) => {
    const app = getAppById(appId);
    if (app) {
      setActiveApp(app);
      try {
        localStorage.setItem('plato_active_app', appId);
      } catch {}
    }
  };

  return (
    <AppContext.Provider value={{ activeApp, setActiveApp, switchToApp }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}
