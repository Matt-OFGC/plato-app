"use client";

import { useState } from "react";
import { CommandBar } from "./CommandBar";

export function CommandBarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {children}
      <CommandBar open={open} setOpen={setOpen} />
      
      {/* Keyboard shortcut hint */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden sm:inline">Quick search</span>
          <kbd className="hidden sm:inline px-2 py-1 text-xs bg-gray-100 rounded border border-gray-300">
            ⌘K
          </kbd>
        </button>
      </div>
    </>
  );
}

