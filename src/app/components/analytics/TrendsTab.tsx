"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendsTabProps {
  filters: {
    dateRange: { start: Date; end: Date };
    categories: number[];
    recipes: number[];
    period: "daily" | "weekly" | "monthly";
  };
}

const CHART_COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

export function TrendsTab({ filters }: TrendsTabProps) {
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
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 animate-pulse">
          <div className="h-6 bg-slate-800 rounded mb-4"></div>
          <div className="h-64 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  const getChartData = () => {
    if (!data) return [];
    
    if (analysisType === "seasonal") {
      return data.patterns || [];
    } else if (analysisType === "yoy") {
      return [
        { period: `${data.previousYear}`, value: parseFloat(data.previousTotal) },
        { period: `${data.currentYear}`, value: parseFloat(data.currentTotal) }
      ];
    } else {
      return data.data || [];
    }
  };

  const getDataKey = () => {
    if (analysisType === "seasonal") {
      return "revenue";
    } else if (analysisType === "yoy") {
      return "value";
    } else {
      switch (activeMetric) {
        case "revenue":
          return "revenue";
        case "production":
          return "quantity";
        case "ingredient_costs":
          return "avgPrice";
        default:
          return "revenue";
      }
    }
  };

  const getYAxisFormatter = (value: number) => {
    if (analysisType === "seasonal") {
      return `£${(value / 1000).toFixed(0)}K`;
    } else if (analysisType === "yoy") {
      return `£${(value / 1000).toFixed(0)}K`;
    } else {
      switch (activeMetric) {
        case "revenue":
          return `£${(value / 1000).toFixed(0)}K`;
        case "production":
          return value.toFixed(0);
        case "ingredient_costs":
          return `£${value.toFixed(2)}`;
        default:
          return `£${(value / 1000).toFixed(0)}K`;
      }
    }
  };

  const getTooltipFormatter = (value: any, name: string) => {
    if (analysisType === "seasonal") {
      return [`£${parseFloat(value).toFixed(2)}`, 'Revenue'];
    } else if (analysisType === "yoy") {
      return [`£${parseFloat(value).toFixed(2)}`, 'Total'];
    } else {
      switch (activeMetric) {
        case "revenue":
          return [`£${parseFloat(value).toFixed(2)}`, 'Revenue'];
        case "production":
          return [parseFloat(value).toFixed(0), 'Quantity'];
        case "ingredient_costs":
          return [`£${parseFloat(value).toFixed(2)}`, 'Avg Price'];
        default:
          return [`£${parseFloat(value).toFixed(2)}`, 'Revenue'];
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Metric Selection */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setActiveMetric("revenue")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeMetric === "revenue"
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setActiveMetric("production")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeMetric === "production"
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Production
            </button>
            <button
              onClick={() => setActiveMetric("ingredient_costs")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeMetric === "ingredient_costs"
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Ingredient Costs
            </button>
          </div>

          {/* Analysis Type */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setAnalysisType("trends")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                analysisType === "trends"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Trends
            </button>
            <button
              onClick={() => setAnalysisType("seasonal")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                analysisType === "seasonal"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Seasonal
            </button>
            <button
              onClick={() => setAnalysisType("yoy")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                analysisType === "yoy"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Year-over-Year
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">
          {analysisType === "seasonal" ? "Seasonal Patterns" : 
           analysisType === "yoy" ? "Year-over-Year Comparison" :
           `${activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} Trends`}
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={getChartData()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey={analysisType === "seasonal" ? "month" : "period"}
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={getYAxisFormatter}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#f1f5f9'
              }}
              formatter={getTooltipFormatter}
            />
            <Line 
              type="monotone" 
              dataKey={getDataKey()} 
              stroke="#06b6d4" 
              strokeWidth={3}
              dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {analysisType === "trends" && data.summary && (
            <>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Total {activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)}</h4>
                <div className="text-2xl font-bold text-slate-100 tabular-nums">
                  {activeMetric === "revenue" ? `£${parseFloat(data.summary.totalRevenue).toFixed(2)}` :
                   activeMetric === "production" ? data.summary.totalQuantity :
                   `£${parseFloat(data.summary.totalRevenue).toFixed(2)}`}
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Average {activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)}</h4>
                <div className="text-2xl font-bold text-slate-100 tabular-nums">
                  {activeMetric === "revenue" ? `£${parseFloat(data.summary.avgRevenue).toFixed(2)}` :
                   activeMetric === "production" ? parseFloat(data.summary.avgQuantity).toFixed(0) :
                   `£${parseFloat(data.summary.avgRevenue).toFixed(2)}`}
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Growth Rate</h4>
                <div className={`text-2xl font-bold tabular-nums ${
                  parseFloat(data.growthRate) > 0 ? 'text-emerald-400' : 
                  parseFloat(data.growthRate) < 0 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {parseFloat(data.growthRate).toFixed(1)}%
                </div>
              </div>
            </>
          )}
          
          {analysisType === "seasonal" && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Average Revenue</h4>
              <div className="text-2xl font-bold text-slate-100 tabular-nums">
                £{parseFloat(data.avgRevenue).toFixed(2)}
              </div>
            </div>
          )}
          
          {analysisType === "yoy" && (
            <>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-2">{data.previousYear} Total</h4>
                <div className="text-2xl font-bold text-slate-100 tabular-nums">
                  £{parseFloat(data.previousTotal).toFixed(2)}
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-2">{data.currentYear} Total</h4>
                <div className="text-2xl font-bold text-slate-100 tabular-nums">
                  £{parseFloat(data.currentTotal).toFixed(2)}
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Change</h4>
                <div className={`text-2xl font-bold tabular-nums ${
                  data.isIncrease ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {data.percentChange}%
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Seasonal Insights */}
      {analysisType === "seasonal" && data?.patterns && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Seasonal Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.patterns.map((pattern: any) => (
              <div key={pattern.month} className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-200">
                    {new Date(2024, pattern.month - 1).toLocaleString('default', { month: 'long' })}
                  </h4>
                  <div className="flex gap-2">
                    {pattern.isPeak && <span className="px-2 py-1 bg-emerald-900 text-emerald-300 text-xs rounded">Peak</span>}
                    {pattern.isLow && <span className="px-2 py-1 bg-red-900 text-red-300 text-xs rounded">Low</span>}
                  </div>
                </div>
                <div className="text-sm text-slate-400">
                  Revenue: £{parseFloat(pattern.revenue).toFixed(2)}
                </div>
                <div className={`text-sm ${
                  parseFloat(pattern.deviation) > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {parseFloat(pattern.deviation) > 0 ? '+' : ''}{parseFloat(pattern.deviation).toFixed(1)}% vs average
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
