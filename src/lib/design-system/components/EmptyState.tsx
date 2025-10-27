/**
 * EmptyState - Consistent empty state component
 * Better UX than blank pages
 */

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  gradient?: string;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  gradient = 'from-blue-50 to-purple-50',
}: EmptyStateProps) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl border-2 border-dashed border-gray-300 p-12 text-center`}>
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
