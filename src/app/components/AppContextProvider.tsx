"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getAppFromRoute } from '@/lib/app-routes';
import { getAppByRoute, getAppConfig, appExists } from '@/lib/apps/registry';
import type { App, AppConfig } from '@/lib/apps/types';

interface AppContextType {
  activeApp: App | null;
  appConfig: AppConfig | null;
  setActiveApp: (app: App | null) => void;
  switchToApp: (appId: App) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [activeApp, setActiveApp] = useState<App | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Auto-detect app from current route or query params
  useEffect(() => {
    // First check query params
    const appParam = searchParams?.get("app");
    if (appParam && appExists(appParam)) {
      setActiveApp(appParam);
      try {
        localStorage.setItem('plato_active_app', appParam);
      } catch {}
      return;
    }
    
    // Then check route path
    const appFromRoute = getAppFromRoute(pathname);
    if (appFromRoute) {
      setActiveApp(appFromRoute);
      try {
        localStorage.setItem('plato_active_app', appFromRoute);
      } catch {}
      return;
    }
    
    // Fall back to detecting from route config
    const appConfig = getAppByRoute(pathname);
    if (appConfig) {
      setActiveApp(appConfig.id);
      try {
        localStorage.setItem('plato_active_app', appConfig.id);
      } catch {}
      return;
    }
    
    // Default to plato if no app detected
    if (!activeApp) {
      setActiveApp("plato");
    }
  }, [pathname, searchParams]);

  // Load persisted app on mount
  useEffect(() => {
    try {
      const savedAppId = localStorage.getItem('plato_active_app');
      if (savedAppId && appExists(savedAppId) && !activeApp) {
        setActiveApp(savedAppId);
      }
    } catch {}
  }, []);

  const switchToApp = (appId: App) => {
    setActiveApp(appId);
    try {
      localStorage.setItem('plato_active_app', appId);
    } catch {}
  };

  const appConfig = activeApp ? getAppConfig(activeApp) : null;

  return (
    <AppContext.Provider value={{ activeApp, appConfig, setActiveApp, switchToApp }}>
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
