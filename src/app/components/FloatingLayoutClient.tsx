"use client";

import { useState, useCallback } from "react";
import { FloatingNavigation } from "@/components/FloatingNavigation";
import { FloatingSidebar } from "@/components/FloatingSidebar";
import { PageActionProvider } from "@/components/PageActionContext";
import { RecipeViewProvider } from "@/components/RecipeViewContext";
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
    <PageActionProvider>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif' }}>
        {/* Floating Sidebar */}
        <FloatingSidebar isOpen={sidebarOpen} onClose={handleClose} />
        
        {/* Floating Navigation */}
        <FloatingNavigation onMenuClick={handleMenuClick} sidebarOpen={sidebarOpen} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-auto pt-24 px-6 pb-6">
            <div className="max-w-[95%] mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </PageActionProvider>
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

