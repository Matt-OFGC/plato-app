"use client";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
  };
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  subtitle, 
  className = "" 
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === "number") {
      if (val >= 1000000) {
        return `£${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `£${(val / 1000).toFixed(1)}K`;
      } else {
        return `£${val.toFixed(2)}`;
      }
    }
    return val;
  };

  const getChangeColor = () => {
    if (!change) return "text-slate-400";
    switch (change.type) {
      case "increase":
        return "text-emerald-400";
      case "decrease":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  const getChangeIcon = () => {
    if (!change) return null;
    switch (change.type) {
      case "increase":
        return "↗";
      case "decrease":
        return "↘";
      default:
        return "→";
    }
  };

  return (
    <div className={`bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all duration-200 metric-card ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon && <span className="text-slate-400">{icon}</span>}
            <h3 className="text-sm font-medium text-slate-300">{title}</h3>
          </div>
          
          <div className="text-3xl font-bold text-slate-100 tabular-nums">
            {formatValue(value)}
          </div>
          
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
          
          {change && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${getChangeColor()}`}>
              <span>{getChangeIcon()}</span>
              <span>{Math.abs(change.value).toFixed(1)}%</span>
              <span className="text-slate-500">vs previous period</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
