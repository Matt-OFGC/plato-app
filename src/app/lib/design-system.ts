// Design system utilities
export function useToast() {
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // In a real implementation, this would show a toast notification
    console.log(`Toast: ${type.toUpperCase()} - ${message}`);
  };

  return { showToast };
}

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
    </div>
  );
}