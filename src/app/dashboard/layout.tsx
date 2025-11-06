import type { Metadata } from "next";
import { FloatingLayoutClient } from "@/components/FloatingLayoutClient";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";
import { AppContextProvider } from "@/components/AppContextProvider";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "Dashboard - Plato",
  description: "Manage your ingredients and recipes",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ToastProvider>
      <AppContextProvider>
        <KeyboardShortcutsProvider>
          <FloatingLayoutClient>
            {children}
          </FloatingLayoutClient>
        </KeyboardShortcutsProvider>
      </AppContextProvider>
    </ToastProvider>
  );
}


