"use client";

import { createContext, useContext, useCallback, useRef, ReactNode } from "react";

interface PageActionContextType {
  registerNewAction: (action: () => void) => void;
  unregisterNewAction: () => void;
  triggerNewAction: () => void;
}

const PageActionContext = createContext<PageActionContextType | undefined>(undefined);

export function PageActionProvider({ children }: { children: ReactNode }) {
  const newActionRef = useRef<(() => void) | null>(null);

  const registerNewAction = useCallback((action: () => void) => {
    newActionRef.current = action;
  }, []);

  const unregisterNewAction = useCallback(() => {
    newActionRef.current = null;
  }, []);

  const triggerNewAction = useCallback(() => {
    if (newActionRef.current) {
      newActionRef.current();
    }
  }, []);

  return (
    <PageActionContext.Provider
      value={{
        registerNewAction,
        unregisterNewAction,
        triggerNewAction,
      }}
    >
      {children}
    </PageActionContext.Provider>
  );
}

export function usePageActions() {
  const context = useContext(PageActionContext);
  if (context === undefined) {
    throw new Error("usePageActions must be used within a PageActionProvider");
  }
  return context;
}

