"use client";

import { useState, useEffect } from "react";

type SafetyView = "diary" | "tasks" | "templates" | "temperature" | "equipment" | "insights" | "alerts" | "dashboard";

interface SafetySidebarProps {
  currentView: SafetyView;
  onViewChange: (view: SafetyView) => void;
}

export function SafetySidebar({ currentView, onViewChange }: SafetySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    loadAlertCount();
  }, []);

  async function loadAlertCount() {
    try {
      const response = await fetch("/api/safety/alerts");
      if (response.ok) {
        const data = await response.json();
        const unreadCount = data.filter((a: any) => !a.isRead && !a.isDismissed).length;
        setAlertCount(unreadCount);
      }
    } catch (error) {
      console.error("Failed to load alert count:", error);
    }
  }

  const menuItems = [
    { id: "diary" as SafetyView, label: "Safety Diary", icon: "📅", badge: null },
    { id: "tasks" as SafetyView, label: "Tasks", icon: "✓", badge: null },
    { id: "templates" as SafetyView, label: "Templates", icon: "📋", badge: null },
    { id: "temperature" as SafetyView, label: "Temperature", icon: "🌡️", badge: null },
    { id: "equipment" as SafetyView, label: "Equipment", icon: "⚙️", badge: null },
    { id: "insights" as SafetyView, label: "AI Insights", icon: "🤖", badge: null },
    { id: "alerts" as SafetyView, label: "Alerts", icon: "🚨", badge: alertCount > 0 ? String(alertCount) : null },
    { id: "dashboard" as SafetyView, label: "Compliance", icon: "📊", badge: null },
  ];

  return (
    <div className="w-64 bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-lg p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white text-xl">
          🛡️
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Safety</h2>
          <p className="text-xs text-gray-500">Health & Safety</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 pl-9 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <svg
          className="w-4 h-4 absolute left-3 top-2.5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-blue-600">12</div>
          <div className="text-xs text-blue-600">Today</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-green-600">9</div>
          <div className="text-xs text-green-600">Done</div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  currentView === item.id
                    ? "bg-orange-50 text-orange-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>All systems operational</span>
        </div>
      </div>
    </div>
  );
}

