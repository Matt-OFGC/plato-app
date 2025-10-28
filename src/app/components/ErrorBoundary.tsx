"use client";

import { Component, ReactNode, ErrorInfo } from "react";
import { captureException, addBreadcrumb } from "../../sentry.client.config";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);

    this.setState((prev) => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Add breadcrumb for error tracking
    addBreadcrumb('Error Boundary caught error', 'error', {
      errorMessage: error.message,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1,
    });

    // Capture error with Sentry
    captureException(error, {
      react: {
        componentStack: errorInfo.componentStack,
      },
      errorBoundary: {
        errorCount: this.state.errorCount + 1,
        componentName: this.constructor.name,
      },
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-4xl">
                    ⚠️
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Something went wrong</h1>
                    <p className="text-red-100 mt-1">
                      Don't worry, your data is safe
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Error count warning */}
                {this.state.errorCount > 1 && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-amber-600 text-xl">🔄</span>
                      <span className="font-bold text-amber-900">
                        This error has occurred {this.state.errorCount} times
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-gray-700">
                    We're sorry, but something unexpected happened. Our team has
                    been notified and is working on a fix.
                  </p>
                </div>

                {/* Error Details (development only) */}
                {process.env.NODE_ENV === "development" && this.state.error && (
                  <div className="bg-gray-100 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 mb-2">
                      Error Details (Development Only):
                    </h3>
                    <div className="text-sm font-mono text-gray-800 bg-white p-3 rounded border border-gray-300 overflow-x-auto">
                      <div className="font-bold text-red-600 mb-2">
                        {this.state.error.toString()}
                      </div>
                      {this.state.errorInfo?.componentStack && (
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-900">What you can do:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={this.handleReset}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg"
                    >
                      <svg
                        className="w-5 h-5"
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
                      <span>Try Again</span>
                    </button>

                    <button
                      onClick={() => window.location.reload()}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                    >
                      <svg
                        className="w-5 h-5"
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
                      <span>Reload Page</span>
                    </button>

                    <button
                      onClick={() => (window.location.href = "/dashboard")}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all col-span-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      <span>Go to Dashboard</span>
                    </button>
                  </div>
                </div>

                {/* Help text */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-600 text-xl">💡</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-900 mb-1">Tip</h4>
                      <p className="text-sm text-blue-800">
                        If this problem persists, try clearing your browser cache
                        or using a different browser. You can also contact support
                        for assistance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
