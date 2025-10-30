"use client";

import { useState, useEffect } from "react";

export function StripeStatus() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/admin/stripe-status");
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch Stripe status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!status) {
    return <div className="text-red-600">Failed to load Stripe status</div>;
  }

  const isConfigured = status.status === "configured";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Stripe Integration Status</h2>
        <p className="text-gray-600">Check your Stripe configuration and connection</p>
      </div>

      {/* Status Banner */}
      <div className={`rounded-lg p-6 border-2 ${
        isConfigured 
          ? "bg-green-50 border-green-200" 
          : "bg-yellow-50 border-yellow-200"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isConfigured ? "bg-green-100" : "bg-yellow-100"
          }`}>
            {isConfigured ? (
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${
              isConfigured ? "text-green-900" : "text-yellow-900"
            }`}>
              {isConfigured ? "Stripe Fully Configured" : "Stripe Configuration Incomplete"}
            </h3>
            <p className={`text-sm ${
              isConfigured ? "text-green-700" : "text-yellow-700"
            }`}>
              {status.instructions}
            </p>
          </div>
        </div>
      </div>

      {/* Stripe Connection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stripe Connection</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">API Connection</span>
            <span className={`text-sm font-medium ${
              status.stripeConnection ? "text-green-600" : "text-red-600"
            }`}>
              {status.stripeConnection ? "✅ Connected" : "❌ Not Connected"}
            </span>
          </div>
          {status.stripeError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
              <p className="text-sm text-red-800">Error: {status.stripeError}</p>
            </div>
          )}
          {status.stripeProducts && status.stripeProducts.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Products Found:</p>
              <div className="space-y-1">
                {status.stripeProducts.map((product: any) => (
                  <div key={product.id} className="text-sm text-gray-600">
                    • {product.name} ({product.id})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Environment Variables */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Variables</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(status.environmentVariables || {}).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{key}</span>
              <span className={`text-sm font-medium ${
                value ? "text-green-600" : "text-red-600"
              }`}>
                {value ? "✅ Set" : "❌ Missing"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Status</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Products</h4>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(status.configStatus?.hasProducts || {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{key}</span>
                  <span className={`text-sm font-medium ${
                    value ? "text-green-600" : "text-red-600"
                  }`}>
                    {value ? "✅" : "❌"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Prices</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(status.configStatus?.hasPrices || {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className={`text-sm font-medium ${
                    value ? "text-green-600" : "text-red-600"
                  }`}>
                    {value ? "✅" : "❌"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Missing Items */}
      {status.missingItems && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">Missing Configuration</h3>
          {status.missingItems.missingEnvVars && status.missingItems.missingEnvVars.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Missing Environment Variables:</h4>
              <ul className="list-disc list-inside space-y-1">
                {status.missingItems.missingEnvVars.map((item: string) => (
                  <li key={item} className="text-sm text-yellow-700">{item}</li>
                ))}
              </ul>
            </div>
          )}
          {status.missingItems.missingProducts && status.missingItems.missingProducts.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Missing Products:</h4>
              <ul className="list-disc list-inside space-y-1">
                {status.missingItems.missingProducts.map((item: string) => (
                  <li key={item} className="text-sm text-yellow-700 capitalize">{item}</li>
                ))}
              </ul>
            </div>
          )}
          {status.missingItems.missingPrices && status.missingItems.missingPrices.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Missing Prices:</h4>
              <ul className="list-disc list-inside space-y-1">
                {status.missingItems.missingPrices.map((item: string) => (
                  <li key={item} className="text-sm text-yellow-700">{item.replace(/([A-Z])/g, ' $1').trim()}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Webhook Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhook Configuration</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Webhook Secret</span>
            <span className={`text-sm font-medium ${
              status.configStatus?.hasWebhookSecret ? "text-green-600" : "text-red-600"
            }`}>
              {status.configStatus?.hasWebhookSecret ? "✅ Configured" : "❌ Missing"}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Webhook URL:</p>
            <code className="block bg-gray-100 px-3 py-2 rounded text-sm">
              {typeof window !== 'undefined' ? window.location.origin : ''}{status.webhookUrl}
            </code>
            <p className="text-xs text-gray-500 mt-2">
              Add this URL to your Stripe Dashboard → Developers → Webhooks
            </p>
          </div>
        </div>
      </div>

      {/* Setup Guide Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
        <p className="text-sm text-blue-700 mb-4">
          See <code className="bg-blue-100 px-2 py-1 rounded">STRIPE_SETUP_GUIDE.md</code> for detailed setup instructions.
        </p>
        <button
          onClick={fetchStatus}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
}

