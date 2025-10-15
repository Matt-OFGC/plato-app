"use client";

import { useState } from "react";

type Tab = 'pricing' | 'content' | 'suppliers' | 'database' | 'timers' | 'navigation';

interface SettingsTabsProps {
  children: {
    pricing: React.ReactNode;
    content: React.ReactNode;
    suppliers: React.ReactNode;
    database: React.ReactNode;
    timers: React.ReactNode;
    navigation: React.ReactNode;
  };
}

export function SettingsTabs({ children }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('pricing');

  const tabs = [
    { id: 'pricing' as Tab, label: 'Pricing & Targets', icon: '💰' },
    { id: 'content' as Tab, label: 'Content Organization', icon: '📁' },
    { id: 'suppliers' as Tab, label: 'Suppliers & Info', icon: '🚚' },
    { id: 'navigation' as Tab, label: 'Navigation', icon: '🧭' },
    { id: 'timers' as Tab, label: 'Timers', icon: '⏱️' },
    { id: 'database' as Tab, label: 'Database', icon: '🗄️' },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="bg-white border border-gray-200 rounded-xl p-2 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'pricing' && children.pricing}
        {activeTab === 'content' && children.content}
        {activeTab === 'suppliers' && children.suppliers}
        {activeTab === 'navigation' && children.navigation}
        {activeTab === 'timers' && children.timers}
        {activeTab === 'database' && children.database}
      </div>
    </div>
  );
}

