"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function FloatingBackButton() {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Check if we can go back (not on the first page)
    setCanGoBack(window.history.length > 1);
  }, []);

  const handleBack = () => {
    if (canGoBack) {
      router.back();
    } else {
      // Fallback to dashboard if no history
      router.push('/dashboard');
    }
  };

  // Don't show on dashboard page
  if (typeof window !== 'undefined' && window.location.pathname === '/dashboard') {
    return null;
  }

  return (
    <button
      onClick={handleBack}
      className="fixed top-4 left-4 z-50 floating-nav rounded-2xl p-3 transition-all duration-300 ease-out hover:scale-105 active:scale-95 group"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-center">
        <svg 
          className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors duration-200" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 19l-7-7m0 0l7-7m-7 7h18" 
          />
        </svg>
      </div>
    </button>
  );
}
