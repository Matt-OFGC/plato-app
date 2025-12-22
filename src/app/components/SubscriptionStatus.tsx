"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SubscriptionData {
  subscription: {
    tier: string;
    limits: {
      maxIngredients: number | null;
      maxRecipes: number | null;
    };
  };
  user: {
    subscriptionTier: string;
    subscriptionStatus: string;
    subscriptionEndsAt: string | null;
  };
}

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/subscription/status");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'mvp' }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to create portal session:", error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  const { subscription: sub, user } = subscription;
  const isPaid = sub.tier === "paid" || ["professional", "team", "business", "plato-bake"].includes(sub.tier.toLowerCase());
  const isActive = user.subscriptionStatus === "active" || user.subscriptionStatus === "free";

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {isPaid ? "✨ MVP Plan" : "Free Trial"}
            </h3>
            <p className="text-sm text-gray-700">
              {isPaid ? "Unlimited ingredients and recipes" : "Limited to 5 ingredients and 2 recipes"}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
            isActive 
              ? "bg-emerald-500 text-white shadow-md" 
              : "bg-red-100 text-red-800"
          }`}>
            {user.subscriptionStatus === "free" ? "Free" : 
             user.subscriptionStatus === "active" ? "Active" :
             user.subscriptionStatus === "past_due" ? "Past Due" :
             user.subscriptionStatus === "canceled" ? "Canceled" :
             "Unknown"}
          </div>
        </div>

        {/* Plan Limits */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-200">
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Ingredients</div>
            <div className="text-lg font-bold text-gray-900">
              {sub.limits.maxIngredients === null ? "∞ Unlimited" : `${sub.limits.maxIngredients} max`}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Recipes</div>
            <div className="text-lg font-bold text-gray-900">
              {sub.limits.maxRecipes === null ? "∞ Unlimited" : `${sub.limits.maxRecipes} max`}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade or Manage Section */}
      {!isPaid && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-lg font-bold text-blue-900 mb-2">Upgrade to MVP</h4>
              <p className="text-sm text-blue-800 mb-1">Get unlimited ingredients and recipes</p>
              <p className="text-xl font-bold text-blue-900">£19.99/month</p>
            </div>
            <button
              onClick={handleUpgrade}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
            >
              Upgrade Now →
            </button>
          </div>
        </div>
      )}

      {isPaid && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-lg font-bold text-green-900 mb-2">MVP Plan Active</h4>
              <p className="text-sm text-green-800">
                {user.subscriptionEndsAt ? (
                  <>Renews on <span className="font-semibold">{new Date(user.subscriptionEndsAt).toLocaleDateString()}</span></>
                ) : (
                  "Your subscription is active"
                )}
              </p>
            </div>
            <button
              onClick={handleManageBilling}
              className="px-6 py-3 bg-white border-2 border-gray-300 hover:border-emerald-500 text-gray-700 hover:text-emerald-700 font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap"
            >
              Manage Billing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

