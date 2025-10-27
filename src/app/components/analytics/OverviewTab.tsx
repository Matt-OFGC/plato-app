"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MetricCard } from "./MetricCard";

interface OverviewTabProps {
  filters: {
    dateRange: { start: Date; end: Date };
    categories: number[];
    recipes: number[];
    period: "daily" | "weekly" | "monthly";
  };
  initialMetrics: {
    totalRevenue: number;
    salesCount: number;
    avgRevenuePerSale: number;
    dateRange: { start: Date; end: Date };
  };
}

const CHART_COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

export function OverviewTab({ filters, initialMetrics }: OverviewTabProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, [filters]);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      // Fetch profitability data for key metrics
      const profitabilityResponse = await fetch(
        `/api/analytics/profitability?reportType=top&limit=5&startDate=${filters.dateRange.start.toISOString()}&endDate=${filters.dateRange.end.toISOString()}`
      );
      
      // Fetch trends data for charts
      const trendsResponse = await fetch(
        `/api/analytics/trends?metric=revenue&period=${filters.period}&startDate=${filters.dateRange.start.toISOString()}&endDate=${filters.dateRange.end.toISOString()}`
      );

      // Fetch category profitability for pie chart
      const categoryResponse = await fetch(
        `/api/analytics/profitability?reportType=categories&startDate=${filters.dateRange.start.toISOString()}&endDate=${filters.dateRange.end.toISOString()}`
      );

      const [profitability, trends, categories] = await Promise.all([
        profitabilityResponse.json(),
        trendsResponse.json(),
        categoryResponse.json()
      ]);

      setData({
        profitability: profitability.data || [],
        trends: trends.data || [],
        categories: categories.data || []
      });
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-700 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-slate-800 rounded mb-2"></div>
              <div className="h-8 bg-slate-800 rounded mb-2"></div>
              <div className="h-3 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
        
        {/* Loading skeleton for charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-700 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-slate-800 rounded mb-4"></div>
              <div className="h-64 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate key metrics
  const totalRevenue = data?.profitability?.reduce((sum: number, item: any) => sum + parseFloat(item.totalRevenue || 0), 0) || 0;
  const totalCosts = data?.profitability?.reduce((sum: number, item: any) => sum + parseFloat(item.totalCosts || 0), 0) || 0;
  const grossProfit = totalRevenue - totalCosts;
  const avgFoodCost = totalRevenue > 0 ? (totalCosts / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={totalRevenue}
          icon="💰"
          subtitle={`${data?.profitability?.length || 0} recipes`}
        />
        <MetricCard
          title="Total Costs"
          value={totalCosts}
          icon="📊"
          subtitle="Ingredient costs"
        />
        <MetricCard
          title="Gross Profit"
          value={grossProfit}
          icon="📈"
          subtitle={`${totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0}% margin`}
        />
        <MetricCard
          title="Avg Food Cost"
          value={`${avgFoodCost.toFixed(1)}%`}
          icon="🍽️"
          subtitle="Cost percentage"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 chart-container">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.trends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="period" 
                stroke="#9ca3af"
                fontSize={12}
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
                formatter={(value: any) => [`£${parseFloat(value).toFixed(2)}`, 'Revenue']}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#06b6d4" 
                strokeWidth={3}
                dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Profitability */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 chart-container">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Category Profitability</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data?.categories || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, grossMargin }) => `${category}: ${parseFloat(grossMargin).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="grossMargin"
              >
                {(data?.categories || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
                formatter={(value: any, name: string) => [`${parseFloat(value).toFixed(1)}%`, 'Margin']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performing Recipes */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Top Performing Recipes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Recipe</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Revenue</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Costs</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Profit</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Margin</th>
              </tr>
            </thead>
            <tbody>
              {(data?.profitability || []).slice(0, 5).map((recipe: any, index: number) => (
                <tr key={recipe.recipeId} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-sm text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-xs text-slate-400">
                        {index + 1}
                      </span>
                      {recipe.recipeName}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-200 text-right tabular-nums">
                    £{parseFloat(recipe.totalRevenue).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-200 text-right tabular-nums">
                    £{parseFloat(recipe.totalCosts).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-200 text-right tabular-nums">
                    £{parseFloat(recipe.grossProfit).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right tabular-nums">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      parseFloat(recipe.grossMargin) > 30 
                        ? 'bg-emerald-900 text-emerald-300' 
                        : parseFloat(recipe.grossMargin) > 20 
                        ? 'bg-yellow-900 text-yellow-300'
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {parseFloat(recipe.grossMargin).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
