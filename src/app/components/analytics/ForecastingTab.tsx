"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ForecastingTabProps {
  filters: {
    dateRange: { start: Date; end: Date };
    categories: number[];
    recipes: number[];
    period: "daily" | "weekly" | "monthly";
  };
}

const CHART_COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

export function ForecastingTab({ filters }: ForecastingTabProps) {
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
          {/* Forecast Type Selection */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setActiveForecast("sales")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeForecast === "sales"
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Sales Forecast
            </button>
            <button
              onClick={() => setActiveForecast("ingredients")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeForecast === "ingredients"
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Ingredient Usage
            </button>
            <button
              onClick={() => setActiveForecast("reorder")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeForecast === "reorder"
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-slate-300"
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
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Sales Forecast by Recipe</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="recipeName"
                  stroke="#9ca3af"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  formatter={(value: any, name: string) => [
                    parseFloat(value).toFixed(2), 
                    name === 'forecastedQuantity' ? 'Forecasted' : 
                    name === 'averageQuantity' ? 'Average' : name
                  ]}
                />
                <Legend />
                <Bar dataKey="forecastedQuantity" fill="#06b6d4" name="Forecasted Sales" />
                <Bar dataKey="averageQuantity" fill="#8b5cf6" name="Historical Average" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sales Forecast Table */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Detailed Sales Forecast</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Recipe</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Forecasted Sales</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Historical Average</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Trend</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Confidence</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Data Points</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: any, index: number) => (
                    <tr key={item.recipeId} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-sm text-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-xs text-slate-400">
                            {index + 1}
                          </span>
                          {item.recipeName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-200 text-right tabular-nums">
                        {parseFloat(item.forecastedQuantity).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-200 text-right tabular-nums">
                        {parseFloat(item.averageQuantity).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.trend === 'increasing' ? 'bg-emerald-900 text-emerald-300' :
                          item.trend === 'decreasing' ? 'bg-red-900 text-red-300' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {item.trend}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-right tabular-nums">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          parseFloat(item.confidence) > 80 ? 'bg-emerald-900 text-emerald-300' :
                          parseFloat(item.confidence) > 60 ? 'bg-yellow-900 text-yellow-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {parseFloat(item.confidence).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-200 text-right tabular-nums">
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

      {activeForecast === "ingredients" && (
        <div className="space-y-6">
          {/* Ingredient Usage Chart */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Ingredient Usage Forecast</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="ingredientName"
                  stroke="#9ca3af"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  formatter={(value: any, name: string) => [
                    parseFloat(value).toFixed(2), 
                    name === 'forecastedUsage' ? 'Forecasted' : 
                    name === 'averageUsage' ? 'Average' : name
                  ]}
                />
                <Legend />
                <Bar dataKey="forecastedUsage" fill="#10b981" name="Forecasted Usage" />
                <Bar dataKey="averageUsage" fill="#8b5cf6" name="Historical Average" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ingredient Usage Table */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Detailed Ingredient Forecast</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Ingredient</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Forecasted Usage</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Average Usage</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Unit</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Trend</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: any, index: number) => (
                    <tr key={item.ingredientId} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-sm text-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-xs text-slate-400">
                            {index + 1}
                          </span>
                          {item.ingredientName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-200 text-right tabular-nums">
                        {parseFloat(item.forecastedUsage).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-200 text-right tabular-nums">
                        {parseFloat(item.averageUsage).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-200 text-right">
                        {item.unit}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.trend === 'increasing' ? 'bg-emerald-900 text-emerald-300' :
                          item.trend === 'decreasing' ? 'bg-red-900 text-red-300' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {item.trend}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-right tabular-nums">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          parseFloat(item.confidence) > 80 ? 'bg-emerald-900 text-emerald-300' :
                          parseFloat(item.confidence) > 60 ? 'bg-yellow-900 text-yellow-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {parseFloat(item.confidence).toFixed(0)}%
                        </span>
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
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Reorder Suggestions</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Ingredient</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Current Stock</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Daily Usage</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Days Until Empty</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Suggested Reorder</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: any, index: number) => (
                    <tr key={item.ingredientId} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-sm text-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-xs text-slate-400">
                            {index + 1}
                          </span>
                          {item.ingredientName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-200 text-right tabular-nums">
                        {parseFloat(item.currentStock).toFixed(2)} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-200 text-right tabular-nums">
                        {parseFloat(item.dailyUsage).toFixed(2)} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-200 text-right tabular-nums">
                        {parseFloat(item.daysUntilEmpty).toFixed(1)} days
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-200 text-right tabular-nums">
                        {parseFloat(item.suggestedReorder).toFixed(2)} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.urgent ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Total Items</h4>
                <div className="text-2xl font-bold text-slate-100 tabular-nums">
                  {data.length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Urgent Items</h4>
                <div className="text-2xl font-bold text-red-400 tabular-nums">
                  {data.filter((item: any) => item.urgent).length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Avg Days Until Empty</h4>
                <div className="text-2xl font-bold text-slate-100 tabular-nums">
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
