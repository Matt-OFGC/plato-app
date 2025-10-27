"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProfitabilityTabProps {
  filters: {
    dateRange: { start: Date; end: Date };
    categories: number[];
    recipes: number[];
    period: "daily" | "weekly" | "monthly";
  };
}

const CHART_COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

export function ProfitabilityTab({ filters }: ProfitabilityTabProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"recipes" | "categories">("recipes");
  const [sortBy, setSortBy] = useState<"revenue" | "profit" | "margin">("profit");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchProfitabilityData();
  }, [filters, activeView]);

  const fetchProfitabilityData = async () => {
    setLoading(true);
    try {
      const reportType = activeView === "recipes" ? "recipes" : "categories";
      const response = await fetch(
        `/api/analytics/profitability?reportType=${reportType}&startDate=${filters.dateRange.start.toISOString()}&endDate=${filters.dateRange.end.toISOString()}`
      );
      
      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error('Failed to fetch profitability data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedData = data ? [...data].sort((a: any, b: any) => {
    const aValue = parseFloat(a[sortBy === "margin" ? "grossMargin" : sortBy === "profit" ? "grossProfit" : "totalRevenue"]);
    const bValue = parseFloat(b[sortBy === "margin" ? "grossMargin" : sortBy === "profit" ? "grossProfit" : "totalRevenue"]);
    
    return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
  }) : [];

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

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* View Toggle */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setActiveView("recipes")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "recipes"
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Recipes
            </button>
            <button
              onClick={() => setActiveView("categories")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "categories"
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Categories
            </button>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="revenue">Revenue</option>
              <option value="profit">Profit</option>
              <option value="margin">Margin %</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm hover:bg-slate-700 transition-colors"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">
          {activeView === "recipes" ? "Recipe" : "Category"} Profitability Comparison
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedData.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey={activeView === "recipes" ? "recipeName" : "category"}
              stroke="#9ca3af"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => `£${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#f1f5f9'
              }}
              formatter={(value: any, name: string) => [
                `£${parseFloat(value).toFixed(2)}`, 
                name === 'totalRevenue' ? 'Revenue' : 
                name === 'totalCosts' ? 'Costs' : 
                name === 'grossProfit' ? 'Profit' : name
              ]}
            />
            <Legend />
            <Bar dataKey="totalRevenue" fill="#06b6d4" name="Revenue" />
            <Bar dataKey="totalCosts" fill="#ef4444" name="Costs" />
            <Bar dataKey="grossProfit" fill="#10b981" name="Profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">
          Detailed {activeView === "recipes" ? "Recipe" : "Category"} Analysis
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                  {activeView === "recipes" ? "Recipe" : "Category"}
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Revenue</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Costs</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Profit</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Margin %</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Food Cost %</th>
                {activeView === "recipes" && (
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Batches</th>
                )}
                {activeView === "categories" && (
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Recipes</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item: any, index: number) => (
                <tr key={item[activeView === "recipes" ? "recipeId" : "category"]} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-xs text-slate-400">
                        {index + 1}
                      </span>
                      {item[activeView === "recipes" ? "recipeName" : "category"]}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-200 text-right tabular-nums">
                    £{parseFloat(item.totalRevenue).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-200 text-right tabular-nums">
                    £{parseFloat(item.totalCosts).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-200 text-right tabular-nums">
                    £{parseFloat(item.grossProfit).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right tabular-nums">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      parseFloat(item.grossMargin) > 30 
                        ? 'bg-emerald-900 text-emerald-300' 
                        : parseFloat(item.grossMargin) > 20 
                        ? 'bg-yellow-900 text-yellow-300'
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {parseFloat(item.grossMargin).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-right tabular-nums">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      parseFloat(item.foodCostPercentage) < 30 
                        ? 'bg-emerald-900 text-emerald-300' 
                        : parseFloat(item.foodCostPercentage) < 40 
                        ? 'bg-yellow-900 text-yellow-300'
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {parseFloat(item.foodCostPercentage).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-200 text-right tabular-nums">
                    {activeView === "recipes" ? item.batchesProduced || 0 : item.recipeCount || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      {data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Total Revenue</h4>
            <div className="text-2xl font-bold text-slate-100 tabular-nums">
              £{data.reduce((sum: number, item: any) => sum + parseFloat(item.totalRevenue), 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Total Profit</h4>
            <div className="text-2xl font-bold text-slate-100 tabular-nums">
              £{data.reduce((sum: number, item: any) => sum + parseFloat(item.grossProfit), 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Avg Margin</h4>
            <div className="text-2xl font-bold text-slate-100 tabular-nums">
              {(data.reduce((sum: number, item: any) => sum + parseFloat(item.grossMargin), 0) / data.length).toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
