"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Recipe {
  id: number;
  name: string;
  category: string;
  cost: string;
  sellingPrice: string | null;
  actualFoodCost: string | null;
  yieldQuantity: string;
  yieldUnit: string;
  createdAt: string;
  updatedAt: string;
}

interface Ingredient {
  id: number;
  name: string;
  packPrice: string;
  currency: string;
  lastPriceUpdate: string;
}

interface Category {
  id: number;
  name: string;
  _count: {
    recipes: number;
  };
}

interface AnalyticsDashboardProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  categories: Category[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AnalyticsDashboard({ recipes, ingredients, categories }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");

  // Calculate stats
  const stats = useMemo(() => {
    const totalRecipes = recipes.length;
    const totalIngredients = ingredients.length;
    
    const recipesWithPricing = recipes.filter(r => r.sellingPrice && parseFloat(r.sellingPrice) > 0);
    const avgFoodCost = recipesWithPricing.length > 0
      ? recipesWithPricing.reduce((sum, r) => {
          const cost = parseFloat(r.cost);
          const price = parseFloat(r.sellingPrice || "0");
          const foodCostPct = price > 0 ? (cost / price) * 100 : 0;
          return sum + foodCostPct;
        }, 0) / recipesWithPricing.length
      : 0;

    const totalRecipeCost = recipes.reduce((sum, r) => sum + parseFloat(r.cost), 0);
    const avgRecipeCost = totalRecipes > 0 ? totalRecipeCost / totalRecipes : 0;

    return {
      totalRecipes,
      totalIngredients,
      avgFoodCost: avgFoodCost.toFixed(1),
      avgRecipeCost: avgRecipeCost.toFixed(2),
    };
  }, [recipes, ingredients]);

  // Most expensive recipes
  const expensiveRecipes = useMemo(() => {
    return [...recipes]
      .sort((a, b) => parseFloat(b.cost) - parseFloat(a.cost))
      .slice(0, 10)
      .map(r => ({
        name: r.name.length > 20 ? r.name.substring(0, 20) + "..." : r.name,
        cost: parseFloat(r.cost),
      }));
  }, [recipes]);

  // Recipes by category
  const categoryData = categories.map(cat => ({
    name: cat.name,
    count: cat._count.recipes,
  }));

  // Food cost distribution
  const foodCostDistribution = useMemo(() => {
    const ranges = [
      { label: "Excellent (<25%)", min: 0, max: 25, count: 0 },
      { label: "Good (25-30%)", min: 25, max: 30, count: 0 },
      { label: "Fair (30-35%)", min: 30, max: 35, count: 0 },
      { label: "High (35-40%)", min: 35, max: 40, count: 0 },
      { label: "Very High (>40%)", min: 40, max: 100, count: 0 },
    ];

    recipes.forEach(recipe => {
      if (recipe.sellingPrice && parseFloat(recipe.sellingPrice) > 0) {
        const cost = parseFloat(recipe.cost);
        const price = parseFloat(recipe.sellingPrice);
        const foodCostPct = (cost / price) * 100;

        for (const range of ranges) {
          if (foodCostPct >= range.min && foodCostPct < range.max) {
            range.count++;
            break;
          }
        }
      }
    });

    return ranges.filter(r => r.count > 0);
  }, [recipes]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Recipes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalRecipes}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Ingredients</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalIngredients}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Food Cost %</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.avgFoodCost}%</p>
              <p className="text-xs text-gray-500 mt-1">Target: 25-30%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Recipe Cost</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">£{stats.avgRecipeCost}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Expensive Recipes */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Expensive Recipes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expensiveRecipes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cost" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recipes by Category */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipes by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Food Cost Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Food Cost Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={foodCostDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" angle={-15} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-gray-500">
            <p>Industry standard food cost: 25-30%</p>
          </div>
        </div>

        {/* Cost Trends - Placeholder for future */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-700">Recipes with pricing</span>
              <span className="text-lg font-bold text-green-600">
                {recipes.filter(r => r.sellingPrice).length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-700">Categories</span>
              <span className="text-lg font-bold text-blue-600">
                {categories.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-gray-700">Profitable recipes (&lt;30%)</span>
              <span className="text-lg font-bold text-purple-600">
                {recipes.filter(r => {
                  if (!r.sellingPrice) return false;
                  const cost = parseFloat(r.cost);
                  const price = parseFloat(r.sellingPrice);
                  return (cost / price) * 100 < 30;
                }).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Most/Least Profitable Recipes */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profitability Analysis</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-green-700 mb-3">Most Profitable (Low Food Cost %)</h4>
            <div className="space-y-2">
              {recipes
                .filter(r => r.sellingPrice && parseFloat(r.sellingPrice) > 0)
                .sort((a, b) => {
                  const costA = parseFloat(a.cost) / parseFloat(a.sellingPrice || "1");
                  const costB = parseFloat(b.cost) / parseFloat(b.sellingPrice || "1");
                  return costA - costB;
                })
                .slice(0, 5)
                .map(recipe => {
                  const foodCostPct = (parseFloat(recipe.cost) / parseFloat(recipe.sellingPrice || "1")) * 100;
                  return (
                    <div key={recipe.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-900">{recipe.name}</span>
                      <span className="text-sm font-semibold text-green-600">{foodCostPct.toFixed(1)}%</span>
                    </div>
                  );
                })}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-red-700 mb-3">Needs Attention (High Food Cost %)</h4>
            <div className="space-y-2">
              {recipes
                .filter(r => r.sellingPrice && parseFloat(r.sellingPrice) > 0)
                .sort((a, b) => {
                  const costA = parseFloat(a.cost) / parseFloat(a.sellingPrice || "1");
                  const costB = parseFloat(b.cost) / parseFloat(b.sellingPrice || "1");
                  return costB - costA;
                })
                .slice(0, 5)
                .map(recipe => {
                  const foodCostPct = (parseFloat(recipe.cost) / parseFloat(recipe.sellingPrice || "1")) * 100;
                  return (
                    <div key={recipe.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-sm text-gray-900">{recipe.name}</span>
                      <span className="text-sm font-semibold text-red-600">{foodCostPct.toFixed(1)}%</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

