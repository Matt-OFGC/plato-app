"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");

  const handleUpgrade = async (tier: "professional" | "team" | "business", seats: number = 0) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier,
          interval: billingInterval,
          seats,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: { month: 0, year: 0 },
      period: "forever",
      description: "Perfect for home cooks and small kitchens",
      features: [
        "Up to 15 ingredients",
        "Up to 5 recipes",
        "Basic unit conversions",
        "Cost calculations",
        "Community support",
      ],
      cta: "Get Started Free",
      ctaLink: "/register",
      popular: false,
      isLink: true,
      tier: null,
    },
    {
      id: "professional",
      name: "Professional",
      price: { month: 19, year: 15 },
      description: "Ideal for professional chefs and restaurants",
      features: [
        "Unlimited ingredients",
        "Unlimited recipes",
        "Advanced unit conversions",
        "Real-time cost tracking",
        "Recipe scaling",
        "Export to PDF",
        "Analytics dashboard",
        "Inventory tracking",
        "Priority support",
      ],
      cta: "Upgrade to Professional",
      popular: false,
      isLink: false,
      tier: "professional" as const,
    },
    {
      id: "team",
      name: "Team",
      price: { month: 59, year: 47 },
      description: "For growing food businesses with teams",
      features: [
        "Everything in Professional",
        "5 team seats included",
        "Production planning & scheduling",
        "Device/PIN login for kitchen",
        "Team collaboration tools",
        "Shopping list generation",
        "Priority support",
        "£6/month per additional seat",
      ],
      cta: "Upgrade to Team",
      popular: true,
      isLink: false,
      tier: "team" as const,
    },
    {
      id: "business",
      name: "Business",
      price: { month: 149, year: 119 },
      description: "For established wholesale operations",
      features: [
        "Everything in Team",
        "Unlimited team seats",
        "Wholesale customer management",
        "Customer ordering portal",
        "Custom pricing per customer",
        "Recurring orders automation",
        "Advanced analytics & reporting",
        "Dedicated support",
      ],
      cta: "Upgrade to Business",
      popular: false,
      isLink: false,
      tier: "business" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="app-container">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <img src="/images/plato-logo.svg" alt="Plato" className="h-10 w-auto" />
              <span className="text-2xl font-bold text-gray-900">Plato</span>
            </Link>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Home
              </a>
              <a
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Login
              </a>
              <a
                href="/register"
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2 rounded-lg hover:shadow-md font-semibold transition-all shadow-sm"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="app-container py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 app-container mb-8">
            Choose the plan that fits your needs. Start free and upgrade anytime as your business
            grows.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-gray-100 rounded-xl p-1.5">
            <button
              onClick={() => setBillingInterval("month")}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                billingInterval === "month"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("year")}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                billingInterval === "year"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Annually
              <span className="ml-2 text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4 mb-16">
          {plans.map((plan) => {
            const price = billingInterval === "month" ? plan.price.month : plan.price.year;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${
                  plan.popular
                    ? "border-emerald-500 shadow-xl scale-105"
                    : "border-gray-200 hover:border-gray-300"
                } transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {price === 0 ? "Free" : `£${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-gray-600 ml-1">
                        /{billingInterval === "month" ? "month" : "month"}
                      </span>
                    )}
                  </div>
                  {billingInterval === "year" && price > 0 && (
                    <div className="text-sm text-emerald-600 font-semibold">
                      £{price * 12}/year (20% off)
                    </div>
                  )}
                  <p className="text-gray-600 text-sm mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.isLink ? (
                  <Link
                    href={plan.ctaLink!}
                    className={`block w-full text-center py-3 px-6 rounded-xl font-semibold transition-all ${
                      plan.popular
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-md"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => plan.tier && handleUpgrade(plan.tier)}
                    disabled={isLoading}
                    className={`block w-full text-center py-3 px-6 rounded-xl font-semibold transition-all ${
                      plan.popular
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-md disabled:opacity-50"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50"
                    }`}
                  >
                    {isLoading ? "Processing..." : plan.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="grid gap-8 md:grid-cols-2 app-container">
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect
                immediately with prorated billing.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards and secure payment methods through Stripe.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                How do team seats work?
              </h3>
              <p className="text-gray-600">
                Team plan includes 5 seats. Need more? Add additional seats for £6/month each.
                Business plan includes unlimited seats.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Absolutely. Cancel anytime with no cancellation fees. Your data remains accessible
                for 30 days.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-12 mt-20">
        <div className="app-container">
          <div className="text-center">
            <div className="flex justify-center items-center gap-3 mb-4">
              <img src="/images/plato-logo.svg" alt="Plato" className="h-8 w-auto" />
              <span className="text-xl font-bold text-gray-900">Plato</span>
            </div>
            <p className="text-gray-600 mb-6">Let us do the thinking for you</p>
            <div className="flex justify-center gap-8 text-sm text-gray-600">
              <a href="/" className="hover:text-gray-900 transition-colors">
                Home
              </a>
              <a href="/pricing" className="hover:text-gray-900 transition-colors">
                Pricing
              </a>
              <a href="/login" className="hover:text-gray-900 transition-colors">
                Login
              </a>
              <a href="/register" className="hover:text-gray-900 transition-colors">
                Sign Up
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-8">© 2025 Plato. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
