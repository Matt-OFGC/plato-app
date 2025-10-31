"use client";

import { useState } from "react";

type Tab = 'subscription' | 'pricing' | 'content' | 'suppliers' | 'timers' | 'preferences';

interface SettingsTabsProps {
  children: {
    subscription: React.ReactNode;
    pricing: React.ReactNode;
    content: React.ReactNode;
    suppliers: React.ReactNode;
    timers: React.ReactNode;
    preferences?: React.ReactNode;
  };
}

export function SettingsTabs({ children }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('subscription');

  const tabs = [
    { 
      id: 'subscription' as Tab, 
      label: 'Subscription', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      description: 'Upgrade & manage plan'
    },
    { 
      id: 'pricing' as Tab, 
      label: 'Pricing', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: 'Food cost targets & currency'
    },
    { 
      id: 'content' as Tab, 
      label: 'Content', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      description: 'Categories, shelf life & storage'
    },
    { 
      id: 'suppliers' as Tab, 
      label: 'Suppliers', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      description: 'Manage your suppliers'
    },
    { 
      id: 'timers' as Tab, 
      label: 'Timers', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: 'Timer preferences'
    },
    { 
      id: 'preferences' as Tab, 
      label: 'Preferences', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      description: 'App preferences & shortcuts'
    },
  ];

  return (
    <div>
      {/* Modern Tab Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 min-w-[120px] ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <div className={`${activeTab === tab.id ? 'text-white' : 'text-emerald-600'}`}>
                {tab.icon}
              </div>
              <div className="flex flex-col items-start">
                <span>{tab.label}</span>
                <span className={`text-xs ${activeTab === tab.id ? 'text-emerald-100' : 'text-gray-500'}`}>
                  {tab.description}
                </span>
              </div>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'subscription' && children.subscription}
        {activeTab === 'pricing' && children.pricing}
        {activeTab === 'content' && children.content}
        {activeTab === 'suppliers' && children.suppliers}
        {activeTab === 'timers' && children.timers}
        {activeTab === 'preferences' && (children.preferences || <div className="text-center py-12 text-gray-500">Preferences coming soon...</div>)}
      </div>
    </div>
  );
}

