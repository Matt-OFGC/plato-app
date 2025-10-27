"use client";

import { useState, useEffect } from "react";
import { AnalyticsFilterPanel } from "@/components/analytics/AnalyticsFilterPanel";
import { AnalyticsOverview } from "@/components/analytics/AnalyticsOverview";
import { AnalyticsProfitability } from "@/components/analytics/AnalyticsProfitability";
import { AnalyticsTrends } from "@/components/analytics/AnalyticsTrends";
import { AnalyticsForecasting } from "@/components/analytics/AnalyticsForecasting";
import { AnalyticsReports } from "@/components/analytics/AnalyticsReports";

interface AnalyticsPageClientProps {
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

export function AnalyticsPageClient({ 
  initialCategories, 
  initialRecipes, 
  initialMetrics 
}: AnalyticsPageClientProps) {
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
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-responsive-h2 text-[var(--foreground)]">Analytics & Insights</h1>
        <p className="text-responsive-body text-[var(--muted-foreground)] mt-2">
          Track costs, profitability, and business metrics
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 sm:mb-8">
        <AnalyticsFilterPanel
          categories={initialCategories}
          recipes={initialRecipes}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 sm:mb-8">
        <div className="border-b border-[var(--border)]">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)]"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && (
          <AnalyticsOverview filters={filters} initialMetrics={initialMetrics} />
        )}
        {activeTab === "profitability" && (
          <AnalyticsProfitability filters={filters} />
        )}
        {activeTab === "trends" && (
          <AnalyticsTrends filters={filters} />
        )}
        {activeTab === "forecasting" && (
          <AnalyticsForecasting filters={filters} />
        )}
        {activeTab === "reports" && (
          <AnalyticsReports filters={filters} />
        )}
      </div>
    </div>
  );
}
