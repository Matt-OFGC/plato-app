"use client";

import { useState } from "react";
import { ComplianceDashboard } from "./ComplianceDashboard";
import { AIInsights } from "./AIInsights";
import { SmartAlerts } from "./SmartAlerts";
import { EquipmentTracker } from "./EquipmentTracker";
import { TemperatureMonitoring } from "./TemperatureMonitoring";

type ComplianceTab = "dashboard" | "insights" | "alerts" | "equipment" | "temperature";

export function CompliancePage() {
  const [activeTab, setActiveTab] = useState<ComplianceTab>("dashboard");

  const tabs = [
    { id: "dashboard" as ComplianceTab, label: "Compliance", icon: "📊" },
    { id: "insights" as ComplianceTab, label: "AI Insights", icon: "🤖" },
    { id: "alerts" as ComplianceTab, label: "Alerts", icon: "🚨" },
    { id: "equipment" as ComplianceTab, label: "Equipment", icon: "⚙️" },
    { id: "temperature" as ComplianceTab, label: "Temperature", icon: "🌡️" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-orange-100 text-orange-700 border-2 border-orange-300"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "dashboard" && <ComplianceDashboard />}
        {activeTab === "insights" && <AIInsights />}
        {activeTab === "alerts" && <SmartAlerts />}
        {activeTab === "equipment" && <EquipmentTracker />}
        {activeTab === "temperature" && <TemperatureMonitoring />}
      </div>
    </div>
  );
}

