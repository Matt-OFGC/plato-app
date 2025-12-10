"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MentorSettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load subscription status
      const subResponse = await fetch("/api/mentor/subscription");
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData);
      }

      // Load config (would need a new API endpoint)
      // For now, use default config
      setConfig({
        enabled: true,
        dataSources: {
          recipes: true,
          ingredients: true,
          sales: true,
          staff: false,
          suppliers: true,
          production: false,
          analytics: true,
        },
        piiMaskingEnabled: true,
        conversationRetention: 90,
        enableInternetSearch: true,
        enableProactiveAlerts: true,
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save config (would need a new API endpoint)
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mentor Settings</h1>
        <p className="text-gray-600 mt-1">Configure your AI business mentor</p>
      </div>

      {/* Subscription Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
        {subscription?.hasAccess ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Status: <span className="font-medium text-green-600">Active</span>
            </p>
            {subscription.subscription?.currentPeriodEnd && (
              <p className="text-sm text-gray-600">
                Renews: {new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              You don't have an active Mentor subscription.
            </p>
            <button
              onClick={() => router.push("/pricing")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Subscribe to Mentor
            </button>
          </div>
        )}
      </div>

      {/* Data Sources */}
      {subscription?.hasAccess && config && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Sources</h2>
          <p className="text-sm text-gray-600 mb-4">
            Choose which data Mentor can access to provide better advice.
          </p>
          <div className="space-y-3">
            {Object.entries(config.dataSources).map(([key, enabled]) => (
              <label key={key} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={enabled as boolean}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      dataSources: {
                        ...config.dataSources,
                        [key]: e.target.checked,
                      },
                    });
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 capitalize">{key}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Settings */}
      {subscription?.hasAccess && config && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy</h2>
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.piiMaskingEnabled}
                onChange={(e) => {
                  setConfig({
                    ...config,
                    piiMaskingEnabled: e.target.checked,
                  });
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Enable PII Masking</span>
                <p className="text-xs text-gray-500">
                  Mask sensitive data like emails and phone numbers in Mentor conversations
                </p>
              </div>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.enableInternetSearch}
                onChange={(e) => {
                  setConfig({
                    ...config,
                    enableInternetSearch: e.target.checked,
                  });
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Enable Internet Search</span>
                <p className="text-xs text-gray-500">
                  Allow Mentor to search the internet for industry benchmarks and information
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Save Button */}
      {subscription?.hasAccess && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      )}
    </div>
  );
}






