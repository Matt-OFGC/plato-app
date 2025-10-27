"use client";

import { useState, useEffect } from "react";

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className = "", lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-800 rounded mb-2"></div>
      ))}
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return fallback || (
      <div className="bg-gradient-to-br from-red-900 to-red-800 border border-red-700 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-red-200">Something went wrong</h3>
            <p className="text-sm text-red-300">Please refresh the page or try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="text-slate-400 mb-4">
          {icon}
        </div>
      )}
      <h5 className="text-lg font-medium text-slate-300 mb-2">{title}</h5>
      <p className="text-slate-400 mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

interface StatusBadgeProps {
  status: "success" | "warning" | "error" | "info" | "neutral";
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ status, children, className = "" }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "success":
        return "bg-emerald-900 text-emerald-300";
      case "warning":
        return "bg-yellow-900 text-yellow-300";
      case "error":
        return "bg-red-900 text-red-300";
      case "info":
        return "bg-cyan-900 text-cyan-300";
      default:
        return "bg-slate-700 text-slate-300";
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles()} ${className}`}>
      {children}
    </span>
  );
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, position = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 ml-2";
      default:
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 px-2 py-1 text-xs text-slate-200 bg-slate-900 border border-slate-700 rounded shadow-lg whitespace-nowrap ${getPositionClasses()}`}>
          {content}
        </div>
      )}
    </div>
  );
}
