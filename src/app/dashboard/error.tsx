"use client";

import { useEffect } from "react";
import { DatabaseErrorDisplay } from "@/components/DatabaseErrorDisplay";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <DatabaseErrorDisplay />
        
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-xl font-bold text-gray-900">Dashboard Error</h1>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              There was an error loading the dashboard. This is likely due to:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Database connection failure</li>
              <li>Missing user authentication</li>
              <li>Company data not found</li>
              <li>Permission issues</li>
            </ul>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
              <p className="font-medium text-gray-800 mb-1">Development Error Details:</p>
              <p className="text-gray-700 font-mono text-xs break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-gray-600 text-xs mt-1">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={reset}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Refresh Dashboard
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Re-login
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              If this problem persists, please check your database connection and try logging in again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
