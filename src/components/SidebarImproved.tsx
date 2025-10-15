"use client";

import { useState, useEffect } from "react";
import { FloatingNavBar } from "@/components/FloatingNavBar";
import { ALL_NAVIGATION_ITEMS } from "@/lib/navigation-config";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [navigationItems, setNavigationItems] = useState<string[]>(["dashboard", "ingredients", "recipes", "recipe-mixer"]);

  // Fetch navigation preferences
  useEffect(() => {
    fetch("/api/user/navigation-preferences")
      .then((res) => res.json())
      .then((data) => {
        if (data.navigationItems) {
          setNavigationItems(data.navigationItems);
        }
      })
      .catch(() => {
        // Use defaults if API fails
        setNavigationItems(["dashboard", "ingredients", "recipes", "recipe-mixer"]);
      });
  }, []);

  return (
    <>
      {/* Floating Navigation Bar - All Devices */}
      <FloatingNavBar 
        navigationItems={navigationItems}
        onMoreClick={() => setIsOpen(true)}
      />

      {/* MOBILE OVERLAY MENU (for "More" button) */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-4 bottom-20 bg-white rounded-3xl shadow-2xl z-50 max-w-md mx-auto max-h-[60vh] overflow-y-auto">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <h3 className="text-lg font-bold text-gray-900">Menu</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-2 mb-4">
                {ALL_NAVIGATION_ITEMS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className="text-gray-500">
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}