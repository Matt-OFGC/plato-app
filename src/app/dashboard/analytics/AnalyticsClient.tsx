"use client";

import { useState, useEffect } from "react";
import { FilterPanel } from "@/components/analytics/FilterPanel";
import { OverviewTab } from "@/components/analytics/OverviewTab";
import { ProfitabilityTab } from "@/components/analytics/ProfitabilityTab";
import { TrendsTab } from "@/components/analytics/TrendsTab";
import { ForecastingTab } from "@/components/analytics/ForecastingTab";
import { ReportsTab } from "@/components/analytics/ReportsTab";
import { ErrorBoundary } from "@/components/analytics/AnalyticsUtils";

interface AnalyticsClientProps {
  initialCategories: Array<{
    id: number;
    name: string;
    _count: { recipes: number };
  }>;
  initialRecipes: Array<{
    id: number;
    name: string;
    categoryRef: { name: string } | null;
  }>;
  initialMetrics: {
    totalRevenue: number;
    salesCount: number;
    avgRevenuePerSale: number;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
}

export function AnalyticsClient({ 
  initialCategories, 
  initialRecipes, 
  initialMetrics 
}: AnalyticsClientProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({
    dateRange: {
      start: initialMetrics.dateRange.start,
      end: initialMetrics.dateRange.end
    },
    categories: [] as number[],
    recipes: [] as number[],
    period: "monthly" as "daily" | "weekly" | "monthly"
  });

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "profitability", label: "Profitability", icon: "💰" },
    { id: "trends", label: "Trends", icon: "📈" },
    { id: "forecasting", label: "Forecasting", icon: "🔮" },
    { id: "reports", label: "Reports", icon: "📋" }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-800">
        <div className="px-6 py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-slate-400 mt-2">
            Track costs, profitability, and business insights
          </p>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar with filters */}
        <div className="w-80 bg-slate-900 border-r border-slate-800">
          <FilterPanel
            categories={initialCategories}
            recipes={initialRecipes}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Tab navigation */}
          <div className="bg-slate-900 border-b border-slate-800">
            <div className="px-6">
              <nav className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                      activeTab === tab.id
                        ? "border-cyan-500 text-cyan-400"
                        : "border-transparent text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab content */}
          <div className="p-6">
            <ErrorBoundary>
              {activeTab === "overview" && (
                <div className="animate-fadeIn">
                  <OverviewTab filters={filters} initialMetrics={initialMetrics} />
                </div>
              )}
              {activeTab === "profitability" && (
                <div className="animate-fadeIn">
                  <ProfitabilityTab filters={filters} />
                </div>
              )}
              {activeTab === "trends" && (
                <div className="animate-fadeIn">
                  <TrendsTab filters={filters} />
                </div>
              )}
              {activeTab === "forecasting" && (
                <div className="animate-fadeIn">
                  <ForecastingTab filters={filters} />
                </div>
              )}
              {activeTab === "reports" && (
                <div className="animate-fadeIn">
                  <ReportsTab filters={filters} />
                </div>
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
