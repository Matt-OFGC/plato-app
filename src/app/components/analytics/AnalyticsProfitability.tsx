"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsProfitabilityProps {
  filters: {
    dateRange: { start: Date; end: Date };
    categories: number[];
    recipes: number[];
    period: "daily" | "weekly" | "monthly";
  };
}

const CHART_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

export function AnalyticsProfitability({ filters }: AnalyticsProfitabilityProps) {
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
          {/* View Toggle */}
          <div className="flex bg-[var(--muted)] rounded-lg p-1">
            <button
              onClick={() => setActiveView("recipes")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "recipes"
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Recipes
            </button>
            <button
              onClick={() => setActiveView("categories")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === "categories"
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Categories
            </button>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--muted-foreground)]">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            >
              <option value="revenue">Revenue</option>
              <option value="profit">Profit</option>
              <option value="margin">Margin %</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 border border-[var(--border)] rounded-md text-sm hover:bg-[var(--muted)] transition-colors"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          {activeView === "recipes" ? "Recipe" : "Category"} Profitability Comparison
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedData.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={activeView === "recipes" ? "recipeName" : "category"}
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
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
              formatter={(value: any, name: string) => [
                `£${parseFloat(value).toFixed(2)}`, 
                name === 'totalRevenue' ? 'Revenue' : 
                name === 'totalCosts' ? 'Costs' : 
                name === 'grossProfit' ? 'Profit' : name
              ]}
            />
            <Legend />
            <Bar dataKey="totalRevenue" fill="#059669" name="Revenue" />
            <Bar dataKey="totalCosts" fill="#ef4444" name="Costs" />
            <Bar dataKey="grossProfit" fill="#10b981" name="Profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Detailed {activeView === "recipes" ? "Recipe" : "Category"} Analysis
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  {activeView === "recipes" ? "Recipe" : "Category"}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Costs</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Profit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Margin %</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Food Cost %</th>
                {activeView === "recipes" && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Batches</th>
                )}
                {activeView === "categories" && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Recipes</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {sortedData.map((item: any, index: number) => (
                <tr key={item[activeView === "recipes" ? "recipeId" : "category"]} className="hover:bg-[var(--muted)]/50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-[var(--muted)] rounded-full flex items-center justify-center text-xs text-[var(--muted-foreground)] mr-3">
                        {index + 1}
                      </span>
                      {item[activeView === "recipes" ? "recipeName" : "category"]}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)] text-right">
                    £{parseFloat(item.totalRevenue).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)] text-right">
                    £{parseFloat(item.totalCosts).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)] text-right">
                    £{parseFloat(item.grossProfit).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      parseFloat(item.grossMargin) > 30 
                        ? 'bg-green-100 text-green-800' 
                        : parseFloat(item.grossMargin) > 20 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {parseFloat(item.grossMargin).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      parseFloat(item.foodCostPercentage) < 30 
                        ? 'bg-green-100 text-green-800' 
                        : parseFloat(item.foodCostPercentage) < 40 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {parseFloat(item.foodCostPercentage).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)] text-right">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
            <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Total Revenue</h4>
            <div className="text-2xl font-semibold text-[var(--foreground)]">
              £{data.reduce((sum: number, item: any) => sum + parseFloat(item.totalRevenue), 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
            <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Total Profit</h4>
            <div className="text-2xl font-semibold text-[var(--foreground)]">
              £{data.reduce((sum: number, item: any) => sum + parseFloat(item.grossProfit), 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
            <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Avg Margin</h4>
            <div className="text-2xl font-semibold text-[var(--foreground)]">
              {(data.reduce((sum: number, item: any) => sum + parseFloat(item.grossMargin), 0) / data.length).toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
