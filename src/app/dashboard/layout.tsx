import type { Metadata } from "next";
import { Sidebar } from "@/components/SidebarImproved";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";

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
    <KeyboardShortcutsProvider>
      <div className="flex min-h-screen">
        {/* Sidebar Navigation */}
        <Sidebar />
        
    {/* Main Content Area */}
    <main className="flex-1 pl-4 md:pl-16 lg:pl-20 xl:pl-24 safe-area-inset-left">
      <div className="container-responsive">
        <div className="py-4 sm:py-6 md:py-8">
          {children}
        </div>
      </div>
    </main>
    
    {/* Floating back button removed to avoid overlapping the sidebar */}
      </div>
    </KeyboardShortcutsProvider>
  );
}


