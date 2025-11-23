"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function PlatoBakePricingPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier: "plato-bake",
          interval: "month",
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

  const plan = {
    id: "plato-bake",
    name: "Plato Bake",
    price: 19.99,
    description: "Perfect for bakeries",
    features: [
      "Unlimited recipes",
      "Unlimited ingredients",
      "Production planning & scheduling",
      "Team task assignments",
      "Label generation",
      "Allergen sheets",
      "Sales sheets",
      "Cost tracking & calculations",
      "Recipe scaling",
      "Export to PDF",
    ],
    cta: "Get Started",
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="app-container">
          <div className="flex justify-between items-center h-16">
            <Link href="/bake" className="flex items-center gap-3">
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Plato Bake
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <a
                href="/bake"
                className="text-gray-600 hover:text-orange-500 font-medium transition-colors"
              >
                Home
              </a>
              <a
                href="/bake/login"
                className="text-gray-600 hover:text-orange-500 font-medium transition-colors"
              >
                Login
              </a>
              <a
                href="/bake/register"
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2 rounded-lg hover:shadow-md font-semibold transition-all shadow-sm hover:from-orange-600 hover:to-amber-600"
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
          <p className="text-xl text-gray-600 app-container mb-4">
            One plan, everything you need for your bakery. Start free and upgrade anytime.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-2xl mx-auto mb-8">
            <p className="text-sm text-orange-800">
              <strong>How apps work:</strong> Subscribe to Plato Bake and get access to all bakery features. 
              You can add more apps later (like scheduling or safety) from your account - all from one login. 
              Pay only for the apps you need, cancel anytime.
            </p>
          </div>
        </div>

        <div className="max-w-md mx-auto mb-8">
          <div className="relative bg-white rounded-2xl border-2 border-orange-500 shadow-xl p-8 flex flex-col">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-md">
                Perfect for Bakeries
              </span>
            </div>

            <div className="text-center mb-6 pt-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900">£{plan.price}</span>
                <span className="text-gray-600 ml-1">/month</span>
              </div>
              <p className="text-gray-600 text-sm mt-2">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"
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

            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                plan.cta
              )}
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gradient-to-b from-orange-50/50 to-white rounded-2xl p-12 text-center mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="grid gap-8 md:grid-cols-2 app-container">
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or cancel your plan at any time. Changes take effect immediately.
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
                Do I need a credit card to start?
              </h3>
              <p className="text-gray-600">
                No! Start with a free trial. You only need to add a payment method when you're ready to upgrade.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Absolutely. Cancel anytime with no cancellation fees. Your data remains accessible for 30 days.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                Can I add more apps later?
              </h3>
              <p className="text-gray-600">
                Yes! Once you have an account, you can subscribe to additional apps (like scheduling or safety) 
                from your account settings. All apps use the same login - no need for separate accounts.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                Do I need separate accounts for different apps?
              </h3>
              <p className="text-gray-600">
                No! One account gives you access to all Plato apps you've subscribed to. Sign up once, 
                add apps as you need them, all from the same login.
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
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Plato Bake
              </span>
            </div>
            <p className="text-gray-600 mb-6">For bakeries</p>
            <div className="flex justify-center gap-8 text-sm text-gray-600">
              <a href="/bake" className="hover:text-orange-500 transition-colors">Home</a>
              <a href="/bake/pricing" className="hover:text-orange-500 transition-colors">Pricing</a>
              <a href="/bake/login" className="hover:text-orange-500 transition-colors">Login</a>
              <a href="/bake/register" className="hover:text-orange-500 transition-colors">Sign Up</a>
            </div>
            <p className="text-sm text-gray-500 mt-8">© 2025 Plato Bake. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

