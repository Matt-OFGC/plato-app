"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CostData {
  name: string;
  value: number;
  color: string;
  [key: string]: any; // Allow additional properties for recharts
}

interface CostBreakdownChartProps {
  items: Array<{
    ingredientId: number;
    quantity: number;
    unit: string;
    ingredient: {
      packQuantity: number;
      packUnit: string;
      packPrice: number;
      densityGPerMl?: number | null;
    };
  }>;
  ingredients: Array<{
    id: number;
    name: string;
  }>;
}

const COLORS = [
  '#059669', // emerald-600
  '#10b981', // emerald-500
  '#34d399', // emerald-400
  '#6ee7b7', // emerald-300
  '#a7f3d0', // emerald-200
  '#d1fae5', // emerald-100
  '#16a34a', // green-600
  '#22c55e', // green-500
  '#4ade80', // green-400
  '#86efac', // green-300
];

export function CostBreakdownChart({ items, ingredients }: CostBreakdownChartProps) {
  // Calculate costs for each ingredient
  const costData: CostData[] = items
    .map((item, index) => {
      const ingredient = ingredients.find(i => i.id === item.ingredientId);
      if (!ingredient) return null;

      // Calculate cost using the same logic as the form
      const pricePerBase = item.ingredient.packPrice / Number(item.ingredient.packQuantity);
      
      // Convert usage quantity to base units
      let usageBaseAmount = item.quantity;
      if (item.unit !== item.ingredient.packUnit) {
        // Simple conversion - in a real app you'd use the proper unit conversion
        if (item.unit === 'kg' && item.ingredient.packUnit === 'g') {
          usageBaseAmount = item.quantity * 1000;
        } else if (item.unit === 'g' && item.ingredient.packUnit === 'kg') {
          usageBaseAmount = item.quantity / 1000;
        } else if (item.unit === 'l' && item.ingredient.packUnit === 'ml') {
          usageBaseAmount = item.quantity * 1000;
        } else if (item.unit === 'ml' && item.ingredient.packUnit === 'l') {
          usageBaseAmount = item.quantity / 1000;
        }
      }

      const cost = pricePerBase * usageBaseAmount;

      return {
        name: ingredient.name,
        value: Math.round(cost * 100) / 100, // Round to 2 decimal places
        color: COLORS[index % COLORS.length],
      };
    })
    .filter((item): item is CostData => item !== null)
    .sort((a, b) => b.value - a.value); // Sort by cost descending

  const totalCost = costData.reduce((sum, item) => sum + item.value, 0);

  if (costData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
        <div className="text-center text-gray-500 py-8">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>Add ingredients to see cost breakdown</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalCost) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            £{data.value.toFixed(2)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={costData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {costData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => (
                <span style={{ color: entry.color, fontSize: '12px' }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Total Cost: <span className="font-semibold text-emerald-600">£{totalCost.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );
}
