"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface FloatingSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingSearch({ isOpen, onClose }: FloatingSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync search term with URL params when opened
  useEffect(() => {
    if (isOpen) {
      const currentSearch = searchParams.get("search") || "";
      setSearchTerm(currentSearch);
      // Focus input when opened
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, searchParams]);

  // Update URL params when search term changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      } else {
        params.delete("search");
      }
      
      const newUrl = `${pathname}?${params.toString()}`;
      router.push(newUrl);
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timer);
  }, [searchTerm, router, searchParams, pathname]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Search Input */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
        <div className="bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-200/50 rounded-2xl p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  onClose();
                }
              }}
              className="block w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-lg"
              placeholder={
                pathname.startsWith("/dashboard/recipes")
                  ? "Search recipes by name, description, or method..."
                  : pathname.startsWith("/dashboard/ingredients")
                  ? "Search ingredients by name, supplier, or notes..."
                  : "Search..."
              }
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  inputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
            <span>Press ESC to close</span>
            {searchTerm && (
              <span className="text-emerald-600">
                Searching for &quot;{searchTerm}&quot;
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

