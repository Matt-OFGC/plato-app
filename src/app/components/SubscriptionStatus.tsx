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
      // Default upgrade to Professional monthly unless overridden elsewhere
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'professional', interval: 'month' }),
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
  const isPro = sub.tier === "pro";
  const isActive = user.subscriptionStatus === "active" || user.subscriptionStatus === "free";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isPro ? "Pro Plan" : "Free Plan"}
          </h3>
          <p className="text-sm text-gray-600">
            {isPro ? "Unlimited ingredients and recipes" : "Limited to 15 ingredients and 5 recipes"}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isActive 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {user.subscriptionStatus === "free" ? "Free" : 
           user.subscriptionStatus === "active" ? "Active" :
           user.subscriptionStatus === "past_due" ? "Past Due" :
           user.subscriptionStatus === "canceled" ? "Canceled" :
           "Unknown"}
        </div>
      </div>

      {!isPro && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">Upgrade to Pro</h4>
              <p className="text-sm text-blue-700">Get unlimited ingredients and recipes for £9.99/month</p>
            </div>
            <button
              onClick={handleUpgrade}
              className="btn-primary"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {isPro && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-green-900">Pro Plan Active</h4>
              <p className="text-sm text-green-700">
                {user.subscriptionEndsAt && (
                  <>Renews on {new Date(user.subscriptionEndsAt).toLocaleDateString()}</>
                )}
              </p>
            </div>
            <button
              onClick={handleManageBilling}
              className="btn-outline"
            >
              Manage Billing
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Ingredients:</span>
          <span className="ml-2 font-medium">
            {sub.limits.maxIngredients === null ? "Unlimited" : `${sub.limits.maxIngredients} max`}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Recipes:</span>
          <span className="ml-2 font-medium">
            {sub.limits.maxRecipes === null ? "Unlimited" : `${sub.limits.maxRecipes} max`}
          </span>
        </div>
      </div>
    </div>
  );
}

