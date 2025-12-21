"use client";

import { useState } from "react";

interface EmailVerificationBannerProps {
  userEmail: string;
  isVerified: boolean;
}

export function EmailVerificationBanner({ userEmail, isVerified }: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't show if verified or dismissed
  if (isVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setSent(true);
        setTimeout(() => setSent(false), 5000); // Reset after 5 seconds
      } else {
        setError(data.error || "Failed to send verification email");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-[45] flex justify-center px-4 pb-4 pointer-events-none
                 max-md:pb-[calc(5rem+env(safe-area-inset-bottom,0px)+1rem)]
                 md:pb-6 animate-email-banner-slide-up"
    >
      <div className="bg-white border border-amber-200 rounded-lg shadow-lg max-w-md w-full pointer-events-auto
                      ring-1 ring-amber-100">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-amber-600"
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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                Please verify your email address
              </p>
              <p className="text-xs text-gray-600 mt-1">
                We sent a verification link to <span className="font-semibold text-gray-900">{userEmail}</span>
              </p>
              {error && (
                <p className="text-xs text-red-600 mt-2">{error}</p>
              )}
              <div className="mt-3 flex items-center gap-3">
            {sent ? (
              <div className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Email sent!
              </div>
            ) : (
              <button
                onClick={handleResend}
                disabled={sending}
                    className="text-sm font-semibold text-amber-600 hover:text-amber-700 underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? "Sending..." : "Resend email"}
              </button>
            )}
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
