"use client";

import { useState } from "react";
import { PasswordInput } from "../ui/PasswordInput";

interface ResetPasswordFormProps {
  token?: string;
}

interface ResetError {
  error: string;
  code?: string;
  errorId?: string;
  retryAfter?: number;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<ResetError | null>(null);
  const [cooldown, setCooldown] = useState<number | null>(null);

  // Humanize cooldown time
  const formatCooldown = (seconds: number): string => {
    if (seconds < 60) {
      return `Please wait ${seconds} seconds.`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `Try again in ~${minutes} minute${minutes !== 1 ? 's' : ''}.`;
  };

  // Start cooldown countdown
  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        setEmail("");
      } else {
        setError(result);
        if (result.retryAfter) {
          startCooldown(result.retryAfter);
        }
      }
    } catch (error) {
      setError({
        error: "We couldn't send the reset email. Please try again.",
        code: "NETWORK_ERROR"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailReset = async () => {
    if (!email) return;
    
    setError(null);
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(result);
      }
    } catch (error) {
      setError({
        error: "We couldn't send the reset email. Please try again.",
        code: "NETWORK_ERROR"
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img 
                src="/images/plato-logo.svg" 
                alt="Plato" 
                className="h-12 w-auto"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
            <p className="mt-2 text-sm text-gray-600">
              If that email exists, we've sent a reset link. Check your inbox (and spam). You can request a new link in ~1 minute if needed.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-green-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-600 mb-6">
              We've sent password reset instructions to your email address.
            </p>
            <a 
              href="/login" 
              className="text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              Back to sign in
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/plato-logo.svg" 
              alt="Plato" 
              className="h-12 w-auto"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Reset your password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <div className="font-medium">{error.error}</div>
              {error.errorId && (
                <div className="mt-1 text-xs text-red-500">
                  Error ID: {error.errorId}
                </div>
              )}
            </div>
          )}
          
          {cooldown && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm" aria-live="polite">
              {formatCooldown(cooldown)}
            </div>
          )}
          
          <form onSubmit={handleResetRequest} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
              <input 
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading || cooldown !== null}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-4 rounded-lg hover:shadow-md transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending reset link...
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-3">Or reset by email</p>
            <button
              onClick={handleEmailReset}
              disabled={loading || !email}
              className="text-emerald-600 hover:text-emerald-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send reset email
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <a 
              href="/login" 
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              Back to sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
