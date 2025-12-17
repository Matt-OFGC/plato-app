"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReportIssue } from "./ReportIssue";
import type { CurrentUserAndCompany } from "@/lib/current";

interface CompanyLoadingErrorProps {
  /**
   * The user object (if available) for context
   */
  user?: {
    id: number;
    email: string;
    name?: string | null;
  } | null;
  
  /**
   * Optional error message to display
   */
  errorMessage?: string;
  
  /**
   * Whether to show a "Try Again" button that refreshes the page
   */
  showRetry?: boolean;
  
  /**
   * Custom title for the error message
   */
  title?: string;
  
  /**
   * Custom description for the error message
   */
  description?: string;
  
  /**
   * Whether to show the ReportIssue component
   */
  showReportIssue?: boolean;
  
  /**
   * Additional context for the error report
   */
  errorContext?: {
    page?: string;
    error?: string;
  };
  
  /**
   * Optional: Pass the result from getCurrentUserAndCompany() directly
   * This will extract user and companyId automatically
   */
  currentUserAndCompany?: CurrentUserAndCompany | null;
}

/**
 * A user-friendly error component displayed when company data cannot be loaded.
 * This component provides helpful messaging and actions for users experiencing
 * issues with company data loading.
 */
export function CompanyLoadingError({
  user: userProp,
  errorMessage,
  showRetry = true,
  title,
  description,
  showReportIssue = true,
  errorContext,
  currentUserAndCompany,
}: CompanyLoadingErrorProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Extract user from currentUserAndCompany if provided, otherwise use userProp
  const user = currentUserAndCompany?.user || userProp;

  const handleRetry = () => {
    setIsRefreshing(true);
    // Force a hard refresh to clear any cached data
    router.refresh();
    // Also do a full page reload as backup
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const defaultTitle = "Unable to Load Company Information";
  const defaultDescription = 
    "We're having trouble loading your company information. This might be a temporary issue. " +
    "Please try refreshing the page, or contact support if the problem persists.";

  return (
    <div className="app-container">
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h2 className="text-xl font-semibold text-yellow-900 mb-2">
                {title || defaultTitle}
              </h2>
              <p className="text-yellow-800 mb-4">
                {description || defaultDescription}
              </p>

              {errorMessage && (
                <div className="bg-yellow-100 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-900 font-medium mb-1">Technical Details:</p>
                  <p className="text-xs text-yellow-800 font-mono">{errorMessage}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                {showRetry && (
                  <button
                    onClick={handleRetry}
                    disabled={isRefreshing}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isRefreshing ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Try Again
                      </>
                    )}
                  </button>
                )}

                <a
                  href="/dashboard/companies"
                  className="px-4 py-2 border border-yellow-300 text-yellow-800 rounded-lg hover:bg-yellow-100 transition-colors font-medium"
                >
                  Go to Companies
                </a>

                {showReportIssue && user && (
                  <div className="inline-block">
                    <ReportIssue
                      context={{
                        page: errorContext?.page || (typeof window !== 'undefined' ? window.location.pathname : 'unknown'),
                        error: errorContext?.error || "Company data loading failed",
                        userId: user.id,
                        companyId: null,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Helpful Tips */}
              <div className="mt-6 pt-6 border-t border-yellow-200">
                <p className="text-sm font-medium text-yellow-900 mb-2">💡 What you can do:</p>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Refresh the page to retry loading your company information</li>
                  <li>Check if you're logged into the correct account</li>
                  <li>Try switching to a different company if you have multiple companies</li>
                  <li>Contact support if the issue persists after refreshing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function to check if companyId is null and return the error component
 * Use this in server components for easy null checking
 * 
 * @example
 * ```tsx
 * const { companyId, user } = await getCurrentUserAndCompany();
 * if (!companyId) {
 *   return <CompanyLoadingErrorWrapper user={user} page="dashboard" />;
 * }
 * ```
 */
export function CompanyLoadingErrorWrapper({
  currentUserAndCompany,
  user,
  page,
  title,
  description,
}: {
  currentUserAndCompany?: CurrentUserAndCompany | null;
  user?: { id: number; email: string; name?: string | null } | null;
  page?: string;
  title?: string;
  description?: string;
}) {
  return (
    <CompanyLoadingError
      currentUserAndCompany={currentUserAndCompany}
      user={user}
      title={title}
      description={description}
      showRetry={true}
      showReportIssue={true}
      errorContext={{
        page: page || "unknown",
        error: "Company ID is null after getCurrentUserAndCompany",
      }}
    />
  );
}
