"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the full error details in development/production
    console.error("Dashboard Error Details:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      name: error.name,
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 max-w-2xl w-full">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard Error</h1>
          <p className="text-gray-600 mb-6">
            We couldn't load the dashboard. This might be a temporary issue.
          </p>
          
          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-red-900 mb-2">Error Details:</p>
              <p className="text-sm text-red-800 font-mono">{error.message}</p>
              {error.digest && (
                <p className="text-xs text-red-700 mt-2">Digest: {error.digest}</p>
              )}
            </div>
          )}

          {/* Show digest in production for debugging */}
          {error.digest && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Error ID:</strong> {error.digest}
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                Check server logs for details with this digest ID.
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = "/dashboard"}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Reload Dashboard
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            If this problem persists, try{" "}
            <a
              href="/logout"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              logging out and back in
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
