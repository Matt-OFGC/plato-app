import { SkeletonCard, SkeletonList } from '@/components/SkeletonLoader';

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Channel list skeleton */}
      <div className="w-80 border-r border-gray-200 p-4 space-y-4">
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        <SkeletonList count={6} />
      </div>

      {/* Chat window skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="h-16 border-b border-gray-200 p-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Messages skeleton */}
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-16 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Input skeleton */}
        <div className="h-20 border-t border-gray-200 p-4">
          <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}







