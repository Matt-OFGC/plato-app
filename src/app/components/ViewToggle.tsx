"use client";

import { useState, useEffect } from "react";

type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  defaultView?: ViewMode;
  onChange: (view: ViewMode) => void;
  storageKey: string;
}

export function ViewToggle({ defaultView = 'grid', onChange, storageKey }: ViewToggleProps) {
  const [view, setView] = useState<ViewMode>(defaultView);

  // Load preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'grid' || saved === 'list') {
      setView(saved);
      onChange(saved);
    }
  }, [storageKey, onChange]);

  const handleViewChange = (newView: ViewMode) => {
    setView(newView);
    localStorage.setItem(storageKey, newView);
    onChange(newView);
  };

  return (
    <div className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
      <button
        onClick={() => handleViewChange('grid')}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
          view === 'grid'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
        title="Grid view"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span className="text-sm font-medium">Grid</span>
      </button>
      
      <button
        onClick={() => handleViewChange('list')}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
          view === 'list'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
        title="List view"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="text-sm font-medium">List</span>
      </button>
    </div>
  );
}

