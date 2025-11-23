"use client";

import { useCallback } from "react";
import { FloatingNavigation } from "@/components/FloatingNavigation";
import { FloatingSidebar } from "@/components/FloatingSidebar";
import { PageActionProvider } from "@/components/PageActionContext";
import { RecipeViewProvider } from "@/components/RecipeViewContext";
import { ToastProvider } from "@/components/ToastProvider";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { usePathname } from "next/navigation";

function FloatingLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const isRecipePage = pathname.match(/^\/dashboard\/recipes\/[^/]+$/);

  const handleMenuClick = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen, setSidebarOpen]);

  const handleClose = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  const content = (
    <ToastProvider>
      <PageActionProvider>
        <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif' }}>
        {/* Floating Sidebar */}
        <FloatingSidebar isOpen={sidebarOpen} onClose={handleClose} />
        
        {/* Floating Navigation */}
        <FloatingNavigation onMenuClick={handleMenuClick} sidebarOpen={sidebarOpen} />
        
        {/* Main Content Area */}
        {/* Mobile (iPhone): More top padding for tabs, less horizontal padding, safe area bottom */}
        {/* iPad & Desktop: Standard padding */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-auto 
                         max-md:pt-32 max-md:px-4 max-md:pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]
                         md:pt-24 md:px-4 md:pb-6
                         lg:px-6 lg:pb-8
                         xl:px-8
                         min-h-0">
            <div 
              className="w-full max-w-full mx-auto md:max-w-full lg:max-w-[95%] xl:max-w-[92%] 2xl:max-w-[90%] min-h-full"
              suppressHydrationWarning
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </PageActionProvider>
    </ToastProvider>
  );

  // Wrap in RecipeViewProvider if on a recipe page so FloatingNavigation can access it
  if (isRecipePage) {
    return (
      <RecipeViewProvider initialViewMode="steps">
        {content}
      </RecipeViewProvider>
    );
  }

  return content;
}

export function FloatingLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <FloatingLayoutContent>
        {children}
      </FloatingLayoutContent>
    </SidebarProvider>
  );
}

