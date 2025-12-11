"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordInput } from "@/components/ui/PasswordInput";

interface RegisterError {
  error: string;
  code?: string;
  errorId?: string;
  field?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<RegisterError | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string }>({ score: 0, feedback: "" });
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [lastSubmitData, setLastSubmitData] = useState<any>(null);

  // Auto-redirect countdown after successful registration
  useEffect(() => {
    if (redirectCountdown !== null && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (redirectCountdown === 0) {
      const loginUrl = redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login';
      router.push(loginUrl);
    }
  }, [redirectCountdown, router, redirectTo]);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, feedback: "" });
      return;
    }

    let score = 0;
    let feedback = "";

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character variety
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    // Provide feedback
    if (score <= 2) feedback = "Weak password";
    else if (score <= 4) feedback = "Fair password";
    else if (score <= 5) feedback = "Good password";
    else feedback = "Strong password";

    setPasswordStrength({ score: Math.min(score, 6), feedback });
  }, [password]);

  // Real-time email validation with debounce
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setEmailExists(null);
      return;
    }

    const checkEmail = setTimeout(async () => {
      setEmailCheckLoading(true);
      try {
        // Note: You'd need to create this API endpoint
        const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        setEmailExists(data.exists);
      } catch (err) {
        // Silently fail - don't block registration
        setEmailExists(null);
      } finally {
        setEmailCheckLoading(false);
      }
    }, 800); // Debounce 800ms

    return () => clearTimeout(checkEmail);
  }, [email]);

  const handleSubmit = useCallback(async (e: React.FormEvent, isRetry: boolean = false) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setLoading(true);

    const formData = new URLSearchParams({
      email,
      password,
      company,
      name,
      businessType,
      country,
      phone
    });

    // Store for retry
    setLastSubmitData({ email, password, company, name, businessType, country, phone });

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      const result = await res.json();

      if (res.ok) {
        setStatus(result.message || "Account created successfully! You can now sign in.");
        setRedirectCountdown(5);
        // Clear form on success
        setEmail("");
        setPassword("");
        setCompany("");
        setName("");
        setBusinessType("");
        setPhone("");
        setLastSubmitData(null);
      } else {
        const errorMessage = result.error || "Sign up failed. Please check your information and try again.";
        setError({
          error: errorMessage,
          code: result.code || "REGISTRATION_ERROR",
          errorId: result.errorId
        });
        setStatus(null);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError({
        error: "We couldn't complete sign-up. Please check your internet connection and try again.",
        code: "NETWORK_ERROR"
      });
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [email, password, company, name, businessType, country, phone]);

  const handleRetry = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSubmit(e as any, true);
  };

  // Get color for password strength bar
  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return "bg-red-500";
    if (passwordStrength.score <= 4) return "bg-yellow-500";
    if (passwordStrength.score <= 5) return "bg-emerald-500";
    return "bg-green-600";
  };

  const getPasswordStrengthTextColor = () => {
    if (passwordStrength.score <= 2) return "text-red-600";
    if (passwordStrength.score <= 4) return "text-yellow-600";
    if (passwordStrength.score <= 5) return "text-emerald-600";
    return "text-green-700";
  };

  const loginUrl = redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-emerald-700 to-green-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <div className="mb-8">
            <img
              src="/images/plato-logo.png"
              alt="Plato"
              className="h-14 w-auto filter brightness-0 invert"
            />
          </div>
          <h1 className="text-5xl xl:text-6xl font-bold mb-6 leading-tight">
            Start your<br />culinary journey
          </h1>
          <p className="text-xl text-emerald-50 leading-relaxed max-w-md">
            Join thousands of food businesses using Plato to streamline their operations and grow.
          </p>

          {/* Decorative elements */}
          <div className="mt-12 space-y-4 max-w-md">
            <div className="flex items-center gap-3 text-emerald-50">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-lg">Free 30-day trial, no credit card required</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-50">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg">Set up in minutes, not hours</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-50">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-lg">Unlimited team members</span>
            </div>
          </div>
        </div>

        {/* Animated background circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-2xl space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/images/plato-logo.png"
              alt="Plato"
              className="h-12 w-auto mx-auto"
            />
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Create your account
            </h2>
            <p className="text-base text-gray-600">
              Start managing your culinary operations in minutes
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-red-700 font-medium">{error.error}</p>
                    {(error.code === "USER_EXISTS" || error.code === "EMAIL_ALREADY_EXISTS") && (
                      <a
                        href={loginUrl}
                        className="text-sm text-red-600 hover:text-red-700 underline mt-1 inline-block"
                      >
                        Sign in instead
                      </a>
                    )}
                    {error.code === "NETWORK_ERROR" && lastSubmitData && (
                      <button
                        onClick={handleRetry}
                        className="mt-2 text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold transition-colors"
                      >
                        Retry Registration
                      </button>
                    )}
                    {error.errorId && (
                      <p className="mt-1 text-xs text-red-500">
                        Error ID: {error.errorId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {status && (
              <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-bold text-green-900 mb-2">Account created successfully!</h3>
                    <p className="text-sm text-green-700 mb-4">{status}</p>
                    {redirectCountdown !== null && (
                      <div className="space-y-3">
                        <p className="text-sm text-green-600">
                          Redirecting to login in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}...
                        </p>
                        <button
                          onClick={() => router.push(loginUrl)}
                          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          Go to Login Now
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-gray-400 font-normal text-xs">(optional)</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Smith"
                      autoComplete="name"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base pr-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                      />
                      {emailCheckLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                      {!emailCheckLoading && emailExists === true && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {!emailCheckLoading && emailExists === false && email.includes('@') && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {emailExists === true && (
                      <p className="mt-1 text-xs text-red-600">
                        This email is already registered. <a href={loginUrl} className="underline font-semibold">Sign in instead?</a>
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password (min. 8 characters)"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base"
                  />
                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${getPasswordStrengthTextColor()}`}>
                          {passwordStrength.feedback}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {!password && (
                    <p className="mt-2 text-xs text-gray-500">Must be at least 8 characters long</p>
                  )}
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-4">Business Information</h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Business Name <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="The Golden Spoon Bakery"
                    autoComplete="organization"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Type</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white text-base"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    required
                  >
                    <option value="">Select your business type</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Café">Café</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Catering">Catering</option>
                    <option value="Food Truck">Food Truck</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Bar & Pub">Bar & Pub</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white text-base"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      autoComplete="country-name"
                      required
                    >
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Ireland">Ireland</option>
                      <option value="France">France</option>
                      <option value="Germany">Germany</option>
                      <option value="Spain">Spain</option>
                      <option value="Italy">Italy</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone <span className="text-gray-400 font-normal text-xs">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+44 20 1234 5678"
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || status !== null || emailExists === true}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-3.5 px-6 rounded-xl hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/30 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating your account...
                  </span>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Already using Plato?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <a
                  href={loginUrl}
                  className="inline-flex items-center justify-center text-emerald-600 hover:text-emerald-700 font-semibold transition-colors group"
                >
                  Sign in to your account
                  <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
