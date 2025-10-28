"use client";

import { useState, useEffect } from "react";

type ViewMode = 'grid' | 'list' | 'photos';

interface ViewOption {
  value: ViewMode;
  label: string;
}

interface ViewToggleProps {
  defaultView?: ViewMode;
  onChange: (view: ViewMode) => void;
  storageKey: string;
  options?: ViewOption[];
}

export function ViewToggle({ defaultView = 'grid', onChange, storageKey, options }: ViewToggleProps) {
  const [view, setView] = useState<ViewMode>(defaultView);

  // Default options if none provided
  const viewOptions = options || [
    { value: 'grid' as ViewMode, label: 'Grid' },
    { value: 'list' as ViewMode, label: 'List' }
  ];

  // Load preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    const validOption = viewOptions.find(opt => opt.value === saved);
    if (validOption) {
      setView(validOption.value);
      onChange(validOption.value);
    }
  }, [storageKey, onChange, viewOptions]);

  const handleViewChange = (newView: ViewMode) => {
    setView(newView);
    localStorage.setItem(storageKey, newView);
    onChange(newView);
  };

  return (
    <div className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
      {viewOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => handleViewChange(option.value)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
            view === option.value
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          title={`${option.label} view`}
        >
          {option.value === 'grid' && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          )}
          {option.value === 'list' && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
          {option.value === 'photos' && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          <span className="text-sm font-medium">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

