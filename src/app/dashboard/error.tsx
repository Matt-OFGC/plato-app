'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Dashboard Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We couldn't load the dashboard. This might be a temporary issue.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-left">
            <p className="text-xs font-semibold text-red-800 dark:text-red-200 mb-2">
              Error Details (Development Only):
            </p>
            <p className="text-sm font-mono text-red-700 dark:text-red-300 break-words">
              {error.message}
            </p>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                  Stack Trace
                </summary>
                <pre className="text-xs text-red-600 dark:text-red-400 mt-2 overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors"
          >
            Reload Dashboard
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          If this problem persists, try refreshing the page or{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            logging out and back in
          </a>
          .
        </p>
      </div>
    </div>
  )
}
