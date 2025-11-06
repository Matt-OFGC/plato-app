"use client";

import { useState, useCallback } from "react";
import { FloatingNavigation } from "@/components/FloatingNavigation";
import { FloatingSidebar } from "@/components/FloatingSidebar";
import { PageActionProvider } from "@/components/PageActionContext";
import { RecipeViewProvider } from "@/components/RecipeViewContext";
import { ToastProvider } from "@/components/ToastProvider";
import { usePathname } from "next/navigation";

export function FloatingLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isRecipePage = pathname.match(/^\/dashboard\/recipes\/[^/]+$/);

  const handleMenuClick = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

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
                         md:pt-24 md:px-6 md:pb-6">
            <div className="max-w-full mx-auto
                           max-md:max-w-none
                           md:max-w-[95%]">
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

