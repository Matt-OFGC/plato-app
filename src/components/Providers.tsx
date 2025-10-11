"use client";

import { TimerProvider } from "@/contexts/TimerContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TimerProvider>
      {children}
    </TimerProvider>
  );
}

