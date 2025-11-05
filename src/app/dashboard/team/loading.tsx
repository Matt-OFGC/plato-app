import { SkeletonCard, SkeletonList } from '@/components/SkeletonLoader';

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Seat management skeleton */}
      <SkeletonCard />

      {/* Team members list skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="mb-6">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <SkeletonList count={6} />
      </div>
    </div>
  );
}





