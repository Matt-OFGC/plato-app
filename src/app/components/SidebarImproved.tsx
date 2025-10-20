"use client";

import { useState, useEffect } from "react";
import { ALL_NAVIGATION_ITEMS } from "@/lib/navigation-config";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  // Lock scroll and add global class for background parallax when drawer opens on mobile
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile && isOpen) {
      document.body.classList.add('mobile-drawer-open');
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('mobile-drawer-open');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('mobile-drawer-open');
      document.body.style.overflow = '';
    };
  }, [isOpen]);
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
      {/* Mobile header menu trigger */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed left-3 top-3 z-50 rounded-full bg-white/70 backdrop-blur-lg border border-white/60 shadow-md w-11 h-11 flex items-center justify-center"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>

      {/* Fixed compact sidebar on md+; hidden on mobile */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 group/sidebar z-40">
        <div className="w-16 lg:w-64 group-hover/sidebar:w-56 2xl:group-hover/sidebar:w-64 transition-all duration-200 ease-out h-full flex flex-col items-center py-3">
          {/* Brand / collapse toggle */}
          <button onClick={() => setIsOpen(true)} className="w-12 h-12 rounded-xl floating-nav-enhanced text-gray-700 hover:scale-[1.02] transition-all">
            <svg className="w-5 h-5 m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>

          {/* Vertical icon list */}
          <nav className="mt-3 space-y-2 w-12 lg:w-full px-2">
            {ALL_NAVIGATION_ITEMS.map((item) => (
              <a key={item.value} href={item.href} className="group/item h-12 rounded-xl flex items-center justify-center lg:justify-start gap-3 bg-white/50 border border-white/60 hover:bg-emerald-50/50 hover:border-emerald-200/70 transition-all shadow-sm px-3">
                <div className="text-gray-700 group-hover/item:text-emerald-700">{item.icon}</div>
                <span className="hidden lg:inline-block text-sm font-medium text-gray-800 opacity-0 group-hover/sidebar:opacity-100 transition-opacity">
                  {item.label}
                </span>
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Glassy drawer for full navigation when menu is opened */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Dim background */}
          <div 
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setIsOpen(false)}
            onTouchStart={(e) => {
              const t = e.touches[0];
              setTouchStartX(t.clientX);
              setTouchStartY(t.clientY);
            }}
            onTouchMove={(e) => {
              if (touchStartX == null || touchStartY == null) return;
              const t = e.touches[0];
              const dx = t.clientX - touchStartX;
              const dy = t.clientY - touchStartY;
              if (Math.abs(dx) > Math.abs(dy) && dx < -50) {
                setIsOpen(false);
                setTouchStartX(null);
                setTouchStartY(null);
              }
            }}
            onTouchEnd={() => { setTouchStartX(null); setTouchStartY(null); }}
          />

          {/* Sliding rounded drawer inspired by the provided design */}
          <div className={`absolute left-0 top-0 bottom-0 w-[88vw] max-w-[420px] p-4 transform transition-transform duration-500 ${isOpen ? 'translate-x-0' : '-translate-x-6'}`}
               style={{ transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1.05)' }}>
            <div className="relative h-full rounded-r-3xl shadow-2xl overflow-hidden bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-700 text-white/95 backdrop-blur-md">
              <div className="pointer-events-none absolute inset-y-0 right-2 w-12 rounded-l-3xl bg-white/10 blur-2xl opacity-60" />
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] py-4">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A7 7 0 1118.88 6.196M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <button onClick={() => setIsOpen(false)} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Menu list */}
              <nav className="px-2 py-2">
                {ALL_NAVIGATION_ITEMS.map((item, index) => (
                  <a
                    key={item.value}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors animate-drawer-item"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div className="text-white">
                      {item.icon}
                    </div>
                    <span className="text-[16px] font-medium tracking-tight">
                      {item.label}
                    </span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}