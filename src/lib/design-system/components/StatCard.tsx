/**
 * StatCard - Reusable stat display component
 * Used across all app dashboards
 */

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  gradient?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  onClick?: () => void;
}

export function StatCard({ label, value, icon, gradient = 'from-blue-500 to-blue-600', trend, onClick }: StatCardProps) {
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${gradient} rounded-xl shadow-lg p-6 text-white transform transition-all duration-200 hover:scale-105 hover:shadow-xl ${
        isClickable ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold uppercase opacity-90">{label}</div>
        {icon && <div className="opacity-80">{icon}</div>}
      </div>

      <div className="text-3xl font-bold mb-1">{value}</div>

      {trend && (
        <div className="flex items-center space-x-1 text-xs opacity-90">
          <span className={trend.positive ? 'text-green-200' : 'text-red-200'}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
