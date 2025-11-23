"use client";

import { useEffect, useState } from "react";
import { getAppColors } from "@/lib/themes";
import type { App } from "@/lib/apps/types";

/**
 * Hook to get app-aware colors for components
 * Returns CSS variable names that automatically adapt to the current app
 */
export function useAppColors(initialApp: App = "plato") {
  const [appColors, setAppColors] = useState(() => getAppColors(initialApp));

  useEffect(() => {
    const handleAppChange = (event: Event) => {
      const customEvent = event as CustomEvent<App>;
      setAppColors(getAppColors(customEvent.detail));
    };

    window.addEventListener("appChange", handleAppChange);
    return () => window.removeEventListener("appChange", handleAppChange);
  }, []);

  return appColors;
}

