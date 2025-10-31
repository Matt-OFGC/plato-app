"use client";

import { TimerProvider } from "@/contexts/TimerContext";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
      <ToastProvider>
        <TimerProvider>
          {children}
        </TimerProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

