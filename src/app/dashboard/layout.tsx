import type { Metadata } from "next";
import { Sidebar } from "@/components/SidebarImproved";
import { FloatingBackButton } from "@/components/FloatingBackButton";
import { FloatingNavBar } from "@/components/FloatingNavBar";
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
      
      {/* Floating Navigation Bar with Apple-style scroll animations */}
      <FloatingNavBar 
        navigationItems={["dashboard", "ingredients", "recipes", "recipe-mixer"]}
        enableScrollAnimation={true}
        onMoreClick={() => console.log('More navigation clicked')}
      />
        </div>
      </KeyboardShortcutsProvider>
    </ErrorBoundary>
  );
}


