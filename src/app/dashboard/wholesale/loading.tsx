import { SkeletonCard, SkeletonList, SkeletonTable } from '@/components/SkeletonLoader';

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-4 border-b border-gray-200">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-24 bg-gray-200 rounded-t animate-pulse" />
        ))}
      </div>

      {/* Content skeleton */}
      <SkeletonTable rows={10} columns={6} />
    </div>
  );
}










