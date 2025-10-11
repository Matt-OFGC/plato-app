"use client";

import { TimerProvider } from "@/contexts/TimerContext";
import { FloatingTimers } from "@/components/FloatingTimers";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TimerProvider>
      {children}
      <FloatingTimers />
    </TimerProvider>
  );
}

