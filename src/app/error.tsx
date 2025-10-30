'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log error to console
    console.error('[ERROR] Application error:', error);
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Oops!
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We encountered an unexpected error. Please try again.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-left">
            <p className="text-sm font-mono text-red-800 dark:text-red-200 break-words">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
