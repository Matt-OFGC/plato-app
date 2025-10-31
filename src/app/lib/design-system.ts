// Design system utilities
// Re-export useToast and ToastProvider from ToastProvider for convenience
export { useToast, ToastProvider } from "@/components/ToastProvider";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
    </div>
  );
}