import type { Metadata } from "next";
import { Sidebar } from "@/components/SidebarImproved";
import { CommandBarProvider } from "@/components/CommandBarProvider";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
    <ErrorBoundary>
      <KeyboardShortcutsProvider>
        <CommandBarProvider>
          <div className="flex min-h-screen">
            {/* Sidebar Navigation */}
            <Sidebar />
            
            {/* Main Content Area */}
            <main className="flex-1 md:ml-16 lg:ml-64 transition-all duration-300 pb-20 md:pb-0">
              <div className="max-w-7xl mx-auto px-4 py-8 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </CommandBarProvider>
      </KeyboardShortcutsProvider>
    </ErrorBoundary>
  );
}


