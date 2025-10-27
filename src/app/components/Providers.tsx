"use client";

import { TimerProvider } from "@/contexts/TimerContext";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "@/lib/design-system";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ToastProvider>
        <TimerProvider>
          {children}
        </TimerProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

