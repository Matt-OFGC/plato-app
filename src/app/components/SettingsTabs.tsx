"use client";

import { useState, useRef, useEffect } from "react";

interface SettingsTabsProps {
  children: {
    [key: string]: React.ReactNode;
  };
}

export function SettingsTabs({ children }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(Object.keys(children)[0] || "");
  const tabListRef = useRef<HTMLDivElement>(null);

  const tabs = Object.keys(children).map(key => ({
    id: key,
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
  }));

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, tabId: string) => {
    const currentIndex = tabs.findIndex(tab => tab.id === tabId);
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.id);
    
    // Focus the next tab
    const nextTabButton = tabListRef.current?.querySelector(`[data-tab-id="${nextTab.id}"]`) as HTMLButtonElement;
    nextTabButton?.focus();
  };

  return (
    <div className="space-y-4">
      {/* Sticky Tab Navigation */}
      <div 
        ref={tabListRef}
        className="sticky top-[var(--header-h,72px)] z-20 bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)] border-b border-gray-200"
        role="tablist"
        aria-label="Settings sections"
      >
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {Object.entries(children).map(([key, content]) => (
          <div
            key={key}
            id={`tabpanel-${key}`}
            role="tabpanel"
            aria-labelledby={`tab-${key}`}
            hidden={activeTab !== key}
            className={activeTab === key ? 'block' : 'hidden'}
          >
            {content}
          </div>
        ))}
      </div>
    </div>
  );
}
