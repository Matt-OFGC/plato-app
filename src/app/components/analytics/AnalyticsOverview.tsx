"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsOverviewProps {
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

const CHART_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

export function AnalyticsOverview({ filters, initialMetrics }: AnalyticsOverviewProps) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6 animate-pulse">
              <div className="h-4 bg-[var(--muted)] rounded mb-2"></div>
              <div className="h-8 bg-[var(--muted)] rounded mb-2"></div>
              <div className="h-3 bg-[var(--muted)] rounded"></div>
            </div>
          ))}
        </div>
        
        {/* Loading skeleton for charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6 animate-pulse">
              <div className="h-6 bg-[var(--muted)] rounded mb-4"></div>
              <div className="h-64 bg-[var(--muted)] rounded"></div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                <span className="text-[var(--primary)] text-lg">💰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Total Revenue</p>
              <p className="text-2xl font-semibold text-[var(--foreground)]">
                £{totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                <span className="text-[var(--primary)] text-lg">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Total Costs</p>
              <p className="text-2xl font-semibold text-[var(--foreground)]">
                £{totalCosts.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                <span className="text-[var(--primary)] text-lg">📈</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Gross Profit</p>
              <p className="text-2xl font-semibold text-[var(--foreground)]">
                £{grossProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                <span className="text-[var(--primary)] text-lg">🍽️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Avg Food Cost</p>
              <p className="text-2xl font-semibold text-[var(--foreground)]">
                {avgFoodCost.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Trend */}
        <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.trends || []}>
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

        {/* Category Profitability */}
        <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Category Profitability</h3>
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
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#1f2937'
                }}
                formatter={(value: any, name: string) => [`${parseFloat(value).toFixed(1)}%`, 'Margin']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performing Recipes */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Top Performing Recipes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Recipe</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Costs</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Profit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(data?.profitability || []).slice(0, 5).map((recipe: any, index: number) => (
                <tr key={recipe.recipeId} className="hover:bg-[var(--muted)]/50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)]">
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-[var(--muted)] rounded-full flex items-center justify-center text-xs text-[var(--muted-foreground)] mr-3">
                        {index + 1}
                      </span>
                      {recipe.recipeName}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)] text-right">
                    £{parseFloat(recipe.totalRevenue).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)] text-right">
                    £{parseFloat(recipe.totalCosts).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-[var(--foreground)] text-right">
                    £{parseFloat(recipe.grossProfit).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      parseFloat(recipe.grossMargin) > 30 
                        ? 'bg-green-100 text-green-800' 
                        : parseFloat(recipe.grossMargin) > 20 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
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
