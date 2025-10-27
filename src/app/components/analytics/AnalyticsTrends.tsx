"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsTrendsProps {
  filters: {
    dateRange: { start: Date; end: Date };
    categories: number[];
    recipes: number[];
    period: "daily" | "weekly" | "monthly";
  };
}

export function AnalyticsTrends({ filters }: AnalyticsTrendsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<"revenue" | "production" | "ingredient_costs">("revenue");
  const [analysisType, setAnalysisType] = useState<"trends" | "seasonal" | "yoy">("trends");

  useEffect(() => {
    fetchTrendsData();
  }, [filters, activeMetric, analysisType]);

  const fetchTrendsData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/trends?metric=${activeMetric}&period=${filters.period}&analysisType=${analysisType}&startDate=${filters.dateRange.start.toISOString()}&endDate=${filters.dateRange.end.toISOString()}`
      );
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch trends data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6 animate-pulse">
          <div className="h-6 bg-[var(--muted)] rounded mb-4"></div>
          <div className="h-64 bg-[var(--muted)] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Metric Selection */}
          <div className="flex bg-[var(--muted)] rounded-lg p-1">
            <button
              onClick={() => setActiveMetric("revenue")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeMetric === "revenue"
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setActiveMetric("production")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeMetric === "production"
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Production
            </button>
            <button
              onClick={() => setActiveMetric("ingredient_costs")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeMetric === "ingredient_costs"
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Ingredient Costs
            </button>
          </div>

          {/* Analysis Type */}
          <div className="flex bg-[var(--muted)] rounded-lg p-1">
            <button
              onClick={() => setAnalysisType("trends")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                analysisType === "trends"
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Trends
            </button>
            <button
              onClick={() => setAnalysisType("seasonal")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                analysisType === "seasonal"
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Seasonal
            </button>
            <button
              onClick={() => setAnalysisType("yoy")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                analysisType === "yoy"
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Year-over-Year
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          {analysisType === "seasonal" ? "Seasonal Patterns" : 
           analysisType === "yoy" ? "Year-over-Year Comparison" :
           `${activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} Trends`}
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data?.data || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="period"
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `£${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                color: '#1f2937'
              }}
              formatter={(value: any) => [`£${parseFloat(value).toFixed(2)}`, 'Revenue']}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#059669" 
              strokeWidth={3}
              dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {analysisType === "trends" && data.summary && (
            <>
              <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
                <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Total {activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)}</h4>
                <div className="text-2xl font-semibold text-[var(--foreground)]">
                  {activeMetric === "revenue" ? `£${parseFloat(data.summary.totalRevenue).toFixed(2)}` :
                   activeMetric === "production" ? data.summary.totalQuantity :
                   `£${parseFloat(data.summary.totalRevenue).toFixed(2)}`}
                </div>
              </div>
              <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
                <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Average {activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)}</h4>
                <div className="text-2xl font-semibold text-[var(--foreground)]">
                  {activeMetric === "revenue" ? `£${parseFloat(data.summary.avgRevenue).toFixed(2)}` :
                   activeMetric === "production" ? parseFloat(data.summary.avgQuantity).toFixed(0) :
                   `£${parseFloat(data.summary.avgRevenue).toFixed(2)}`}
                </div>
              </div>
              <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
                <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Growth Rate</h4>
                <div className={`text-2xl font-semibold ${
                  parseFloat(data.growthRate) > 0 ? 'text-green-600' : 
                  parseFloat(data.growthRate) < 0 ? 'text-red-600' : 'text-[var(--muted-foreground)]'
                }`}>
                  {parseFloat(data.growthRate).toFixed(1)}%
                </div>
              </div>
            </>
          )}
          
          {analysisType === "seasonal" && (
            <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
              <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Average Revenue</h4>
              <div className="text-2xl font-semibold text-[var(--foreground)]">
                £{parseFloat(data.avgRevenue).toFixed(2)}
              </div>
            </div>
          )}
          
          {analysisType === "yoy" && (
            <>
              <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
                <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">{data.previousYear} Total</h4>
                <div className="text-2xl font-semibold text-[var(--foreground)]">
                  £{parseFloat(data.previousTotal).toFixed(2)}
                </div>
              </div>
              <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
                <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">{data.currentYear} Total</h4>
                <div className="text-2xl font-semibold text-[var(--foreground)]">
                  £{parseFloat(data.currentTotal).toFixed(2)}
                </div>
              </div>
              <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
                <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Change</h4>
                <div className={`text-2xl font-semibold ${
                  data.isIncrease ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.percentChange}%
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
