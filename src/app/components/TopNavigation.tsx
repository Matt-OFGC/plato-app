"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getFilteredNavigationItems } from "@/lib/navigation-config";
import { AppSwitcher } from "./AppSwitcher";
import { useAppContext } from "./AppContextProvider";

export function TopNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { activeApp, switchToApp } = useAppContext();

  // Get filtered navigation items based on active app
  const navigationItems = getFilteredNavigationItems(activeApp?.id || null);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-neutral-200/60 sticky top-0 z-50 backdrop-blur-xl bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <a href="/dashboard" className="text-xl font-semibold text-neutral-900 hover:text-emerald-600 transition-colors">
                Plato
              </a>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navigationItems
                .filter(item => item.value !== "dashboard") // Dashboard is in logo
                .map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <a
                      key={item.value}
                      href={item.href}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? "text-emerald-600 bg-emerald-50"
                          : "text-neutral-700 hover:text-emerald-600 hover:bg-neutral-50"
                      }`}
                    >
                      {item.label}
                    </a>
                  );
                })}
            </div>

            {/* Right Side - App Switcher & User Menu */}
            <div className="flex items-center gap-3">
              {/* App Switcher - Desktop */}
              <div className="hidden lg:flex items-center gap-2">
                <AppSwitcher
                  activeApp={activeApp}
                  onAppChange={(app) => {
                    switchToApp(app.id);
                    router.push(app.route);
                  }}
                  collapsed={false}
                  isHovered={false}
                  isTouchDevice={false}
                />
              </div>

              {/* Notifications */}
              <button className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              {/* User Avatar */}
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                JD
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white border-b border-neutral-200">
          <div className="px-4 py-4 space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <a
                  key={item.value}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <div className="w-5 h-5">{item.icon}</div>
                  <span className="font-medium">{item.label}</span>
                </a>
              );
            })}
            
            {/* App Switcher - Mobile */}
            <div className="pt-4 border-t border-neutral-200">
              <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                Apps
              </div>
              <AppSwitcher
                activeApp={activeApp}
                onAppChange={(app) => {
                  switchToApp(app.id);
                  router.push(app.route);
                  setIsMobileMenuOpen(false);
                }}
                collapsed={false}
                isHovered={false}
                isTouchDevice={true}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}




