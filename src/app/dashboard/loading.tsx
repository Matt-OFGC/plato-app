import { SkeletonCard, SkeletonList, SkeletonTable } from '@/components/SkeletonLoader';

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      
      {/* Main content skeleton */}
      <SkeletonCard />
      
      {/* List/table skeleton */}
      <SkeletonTable rows={8} columns={4} />
    </div>
  );
}
