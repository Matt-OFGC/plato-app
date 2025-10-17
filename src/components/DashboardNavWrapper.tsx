"use client";

import { useState } from "react";
import { FloatingNavBar } from "@/components/FloatingNavBar";

export function DashboardNavWrapper() {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleMoreClick = () => {
    setShowMoreMenu(!showMoreMenu);
    console.log('More navigation clicked - toggle menu');
  };

  return (
    <>
      {/* Floating Navigation Bar with Apple-style scroll animations */}
      <FloatingNavBar 
        navigationItems={["dashboard", "ingredients", "recipes", "recipe-mixer"]}
        enableScrollAnimation={true}
        onMoreClick={handleMoreClick}
      />
      
      {/* More Menu Overlay */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setShowMoreMenu(false)}>
          <div className="fixed bottom-20 left-4 right-4 md:left-8 md:right-8 lg:left-12 lg:right-12 xl:left-16 xl:right-16">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">More Navigation</h3>
              <div className="grid grid-cols-2 gap-3">
                <a 
                  href="/dashboard/production" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-sm font-medium">Production</span>
                </a>
                
                <a 
                  href="/dashboard/wholesale" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span className="text-sm font-medium">Wholesale</span>
                </a>
                
                <a 
                  href="/dashboard/account" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-medium">Account</span>
                </a>
                
                <a 
                  href="/dashboard/business" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-sm font-medium">Business</span>
                </a>
                
                <a 
                  href="/dashboard/team" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-sm font-medium">Team</span>
                </a>
                
                <a 
                  href="/dashboard/analytics" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-medium">Analytics</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
