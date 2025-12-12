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
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
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
              <p className="text-sm font-medium text-amber-900">
                Please verify your email address
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                We sent a verification link to <span className="font-semibold">{userEmail}</span>
              </p>
              {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
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
                className="text-sm font-semibold text-amber-900 hover:text-amber-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Sending..." : "Resend email"}
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="text-amber-600 hover:text-amber-800 p-1"
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
