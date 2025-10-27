"use client";

import React, { useState, useEffect } from "react";

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
}

export function ChartContainer({ title, children, className = "", loading = false, error }: ChartContainerProps) {
  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
        <div className="h-64 bg-slate-800 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gradient-to-br from-red-900 to-red-800 border border-red-700 rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-red-200 mb-4">{title}</h3>
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all duration-200 ${className}`}>
      <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
      {children}
    </div>
  );
}

interface DataTableProps {
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
    align?: "left" | "center" | "right";
    sortable?: boolean;
  }>;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable({ data, columns, loading = false, emptyMessage = "No data available", className = "" }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-800 rounded mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-slate-400">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              {columns.map((column) => (
                <th 
                  key={column.key}
                  className={`py-3 px-4 text-sm font-medium text-slate-300 ${
                    column.align === 'right' ? 'text-right' : 
                    column.align === 'center' ? 'text-center' : 'text-left'
                  } ${column.sortable ? 'cursor-pointer hover:text-slate-200' : ''}`}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && sortConfig?.key === column.key && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                {columns.map((column) => (
                  <td 
                    key={column.key}
                    className={`py-3 px-4 text-sm text-slate-200 ${
                      column.align === 'right' ? 'text-right tabular-nums' : 
                      column.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface MetricGridProps {
  metrics: Array<{
    title: string;
    value: string | number;
    change?: {
      value: number;
      type: "increase" | "decrease" | "neutral";
    };
    icon?: React.ReactNode;
    subtitle?: string;
  }>;
  className?: string;
}

export function MetricGrid({ metrics, className = "" }: MetricGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {metrics.map((metric, index) => (
        <div key={index} className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {metric.icon && <span className="text-slate-400">{metric.icon}</span>}
                <h3 className="text-sm font-medium text-slate-300">{metric.title}</h3>
              </div>
              
              <div className="text-3xl font-bold text-slate-100 tabular-nums">
                {metric.value}
              </div>
              
              {metric.subtitle && (
                <p className="text-xs text-slate-500 mt-1">{metric.subtitle}</p>
              )}
              
              {metric.change && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${
                  metric.change.type === "increase" ? "text-emerald-400" :
                  metric.change.type === "decrease" ? "text-red-400" : "text-slate-400"
                }`}>
                  <span>
                    {metric.change.type === "increase" ? "↗" :
                     metric.change.type === "decrease" ? "↘" : "→"}
                  </span>
                  <span>{Math.abs(metric.change.value).toFixed(1)}%</span>
                  <span className="text-slate-500">vs previous period</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
