import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({ 
  className, 
  variant = 'rectangular',
  width,
  height,
  animate = true 
}: SkeletonProps) {
  const baseClasses = "bg-gray-200 dark:bg-gray-700";
  const animationClasses = animate ? "animate-pulse" : "";
  
  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "",
    rounded: "rounded-lg",
  };
  
  const style = {
    width,
    height,
  };
  
  return (
    <div
      className={cn(
        baseClasses,
        animationClasses,
        variantClasses[variant],
        className
      )}
      style={style}
    />
  );
}

// Pre-built skeleton components for common patterns

export function SkeletonCard() {
  return (
    <div className="border border-gray-200 rounded-xl p-6 space-y-4">
      <Skeleton variant="rounded" height="24px" width="60%" />
      <Skeleton variant="text" height="16px" width="100%" />
      <Skeleton variant="text" height="16px" width="80%" />
      <div className="flex gap-2 pt-2">
        <Skeleton variant="rounded" height="32px" width="80px" />
        <Skeleton variant="rounded" height="32px" width="80px" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
          <Skeleton variant="circular" width="48px" height="48px" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" height="16px" width="40%" />
            <Skeleton variant="text" height="14px" width="60%" />
          </div>
          <Skeleton variant="rounded" width="80px" height="32px" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b border-gray-200 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" height="16px" className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b border-gray-200 last:border-0 flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} variant="text" height="14px" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="space-y-6">
      <Skeleton variant="rounded" height="40px" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton variant="rounded" height="40px" />
        <Skeleton variant="rounded" height="40px" />
      </div>
      <Skeleton variant="rounded" height="100px" />
      <div className="flex gap-3 justify-end">
        <Skeleton variant="rounded" width="100px" height="40px" />
        <Skeleton variant="rounded" width="100px" height="40px" />
      </div>
    </div>
  );
}
