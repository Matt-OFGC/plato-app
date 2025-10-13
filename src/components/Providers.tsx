"use client";

import { TimerProvider } from "@/contexts/TimerContext";
import { ThemeProvider } from "@/components/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TimerProvider>
        {children}
      </TimerProvider>
    </ThemeProvider>
  );
}

