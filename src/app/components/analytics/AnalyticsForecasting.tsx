"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsForecastingProps {
  filters: {
    dateRange: { start: Date; end: Date };
    categories: number[];
    recipes: number[];
    period: "daily" | "weekly" | "monthly";
  };
}

export function AnalyticsForecasting({ filters }: AnalyticsForecastingProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeForecast, setActiveForecast] = useState<"sales" | "ingredients" | "reorder">("sales");

  useEffect(() => {
    fetchForecastingData();
  }, [filters, activeForecast]);

  const fetchForecastingData = async () => {
    setLoading(true);
    try {
      let response;
      
      if (activeForecast === "reorder") {
        response = await fetch(`/api/analytics/forecasting?forecastType=reorder&maxDays=7`);
      } else {
        response = await fetch(
          `/api/analytics/forecasting?forecastType=${activeForecast}&startDate=${filters.dateRange.start.toISOString()}&endDate=${filters.dateRange.end.toISOString()}`
        );
      }
      
      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error('Failed to fetch forecasting data:', error);
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
          {/* Forecast Type Selection */}
          <div className="flex bg-[var(--muted)] rounded-lg p-1">
            <button
              onClick={() => setActiveForecast("sales")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeForecast === "sales"
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Sales Forecast
            </button>
            <button
              onClick={() => setActiveForecast("ingredients")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeForecast === "ingredients"
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Ingredient Usage
            </button>
            <button
              onClick={() => setActiveForecast("reorder")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeForecast === "reorder"
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Reorder Suggestions
            </button>
          </div>
        </div>
      </div>

      {/* Forecast Content */}
      {activeForecast === "sales" && (
        <div className="space-y-6">
          {/* Sales Forecast Chart */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Sales Forecast by Recipe</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="recipeName"
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#1f2937'
                  }}
                  formatter={(value: any, name: string) => [
                    parseFloat(value).toFixed(2), 
                    name === 'forecastedQuantity' ? 'Forecasted' : 
                    name === 'averageQuantity' ? 'Average' : name
                  ]}
                />
                <Legend />
                <Bar dataKey="forecastedQuantity" fill="#059669" name="Forecasted Sales" />
                <Bar dataKey="averageQuantity" fill="#10b981" name="Historical Average" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sales Forecast Table */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Detailed Sales Forecast</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border)]">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Recipe</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Forecasted Sales</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Historical Average</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Trend</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Confidence</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Data Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.map((item: any, index: number) => (
                    <tr key={item.recipeId} className="hover:bg-[var(--muted)]/50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">
                        <div className="flex items-center">
                          <span className="w-6 h-6 bg-[var(--muted)] rounded-full flex items-center justify-center text-xs text-[var(--muted-foreground)] mr-3">
                            {index + 1}
                          </span>
                          {item.recipeName}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)] text-right">
                        {parseFloat(item.forecastedQuantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)] text-right">
                        {parseFloat(item.averageQuantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                          item.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.trend}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          parseFloat(item.confidence) > 80 ? 'bg-green-100 text-green-800' :
                          parseFloat(item.confidence) > 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {parseFloat(item.confidence).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)] text-right">
                        {item.historicalWeeks || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeForecast === "reorder" && (
        <div className="space-y-6">
          {/* Reorder Suggestions */}
          <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Reorder Suggestions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border)]">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Ingredient</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Current Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Daily Usage</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Days Until Empty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Suggested Reorder</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.map((item: any, index: number) => (
                    <tr key={item.ingredientId} className="hover:bg-[var(--muted)]/50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">
                        <div className="flex items-center">
                          <span className="w-6 h-6 bg-[var(--muted)] rounded-full flex items-center justify-center text-xs text-[var(--muted-foreground)] mr-3">
                            {index + 1}
                          </span>
                          {item.ingredientName}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)] text-right">
                        {parseFloat(item.currentStock).toFixed(2)} {item.unit}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)] text-right">
                        {parseFloat(item.dailyUsage).toFixed(2)} {item.unit}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)] text-right">
                        {parseFloat(item.daysUntilEmpty).toFixed(1)} days
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)] text-right">
                        {parseFloat(item.suggestedReorder).toFixed(2)} {item.unit}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.urgent ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.urgent ? 'Urgent' : 'Normal'}
                        </span>
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
                <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Total Items</h4>
                <div className="text-2xl font-semibold text-[var(--foreground)]">
                  {data.length}
                </div>
              </div>
              <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
                <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Urgent Items</h4>
                <div className="text-2xl font-semibold text-red-600">
                  {data.filter((item: any) => item.urgent).length}
                </div>
              </div>
              <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
                <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">Avg Days Until Empty</h4>
                <div className="text-2xl font-semibold text-[var(--foreground)]">
                  {(data.reduce((sum: number, item: any) => sum + parseFloat(item.daysUntilEmpty), 0) / data.length).toFixed(1)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
