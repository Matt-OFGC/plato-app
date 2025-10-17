import type { Metadata } from "next";
import { Sidebar } from "@/components/SidebarImproved";
import { FloatingBackButton } from "@/components/FloatingBackButton";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DashboardNavWrapper } from "@/components/DashboardNavWrapper";

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
        <div className="flex min-h-screen">
          {/* Sidebar Navigation */}
          <Sidebar />
          
          {/* Main Content Area */}
      <main className="flex-1 pb-24 safe-area-inset-bottom">
        <div className="container-responsive">
          <div className="py-4 sm:py-6 md:py-8">
            {children}
          </div>
        </div>
      </main>
      
      {/* Floating Back Button */}
      <FloatingBackButton />
      
      {/* Floating Navigation Bar with More Menu */}
      <DashboardNavWrapper />
        </div>
      </KeyboardShortcutsProvider>
    </ErrorBoundary>
  );
}


