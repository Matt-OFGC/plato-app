"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Company {
  id: number;
  name: string;
  maxSeats: number | null;
}

interface Subscription {
  id: number;
  userId: number;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: string;
  tier: string;
  price: number;
  currency: string;
  interval: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  user: {
    id: number;
    email: string;
    name: string | null;
  };
}

interface Props {
  company: Company;
  subscriptions: Subscription[];
  currentUserId: number;
}

export function CompanyBillingDashboard({ company, subscriptions, currentUserId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleOpenBillingPortal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/portal", {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        alert("Failed to open billing portal");
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error);
      alert("Failed to open billing portal");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  const activeSubscriptions = subscriptions.filter(
    s => s.status === "active" || s.status === "trialing"
  );
  const totalMonthlyCost = activeSubscriptions.reduce((sum, sub) => {
    if (sub.interval === "month") {
      return sum + sub.price;
    } else if (sub.interval === "year") {
      return sum + sub.price / 12;
    }
    return sum;
  }, 0);

  return (
    <div className="app-container">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
            <p className="text-gray-600 mt-2">{company.name}</p>
          </div>
          <a
            href={`/dashboard/companies/${company.id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Company
          </a>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Active Subscriptions</div>
          <div className="text-3xl font-bold text-gray-900">{activeSubscriptions.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Monthly Cost</div>
          <div className="text-3xl font-bold text-gray-900">
            {totalMonthlyCost > 0 ? `$${totalMonthlyCost.toFixed(2)}` : "Free"}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Team Seats</div>
          <div className="text-3xl font-bold text-gray-900">
            {company.maxSeats || "Unlimited"}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Billing</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleOpenBillingPortal}
            disabled={loading}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? "Opening..." : "Manage Billing Portal"}
          </button>
          <button
            onClick={handleUpgrade}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Upgrade Plan
          </button>
          <a
            href="/pricing"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            View Plans
          </a>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Team Subscriptions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Subscriptions for team members in this company
          </p>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">No subscriptions found</p>
            <button
              onClick={handleUpgrade}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {subscription.user.name || subscription.user.email}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          subscription.status === "active"
                            ? "bg-green-100 text-green-700"
                            : subscription.status === "trialing"
                            ? "bg-blue-100 text-blue-700"
                            : subscription.status === "canceled"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {subscription.status}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded capitalize">
                        {subscription.tier}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        {subscription.currency.toUpperCase()} {subscription.price.toFixed(2)} / {subscription.interval}
                      </div>
                      <div>
                        Period: {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </div>
                      {subscription.stripeSubscriptionId && (
                        <div className="text-xs text-gray-500">
                          Subscription ID: {subscription.stripeSubscriptionId.substring(0, 20)}...
                        </div>
                      )}
                    </div>
                  </div>
                  {subscription.userId === currentUserId && (
                    <button
                      onClick={handleOpenBillingPortal}
                      className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Manage
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing History</h2>
        <p className="text-gray-600 text-sm">
          View detailed billing history and invoices in the{" "}
          <button
            onClick={handleOpenBillingPortal}
            className="text-emerald-600 hover:text-emerald-700 underline"
          >
            billing portal
          </button>
          .
        </p>
      </div>
    </div>
  );
}
