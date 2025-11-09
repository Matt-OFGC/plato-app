"use client";

import { useState, useEffect } from "react";

export function FeatureAccessDiagnostic() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostic = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/features/unlock-status?t=" + Date.now(), {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`API Error ${res.status}: ${text}`);
        return;
      }
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostic();
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Feature Access Diagnostic</h2>
        <button
          onClick={fetchDiagnostic}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 font-semibold">Error:</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Debug Info</h3>
            <pre className="text-xs overflow-auto bg-white p-3 rounded border">
              {JSON.stringify(data.debug, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Unlock Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(data.unlockStatus || {}).map(([key, value]: [string, any]) => (
                <div
                  key={key}
                  className={`p-3 rounded border ${
                    value?.unlocked
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="font-semibold capitalize">{key}</div>
                  <div className="text-sm">
                    {value?.unlocked ? "✅ Unlocked" : "🔒 Locked"}
                  </div>
                  {value?.isTrial && (
                    <div className="text-xs text-yellow-600 mt-1">Trial</div>
                  )}
                  {value?.status && (
                    <div className="text-xs text-gray-600 mt-1">{value.status}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Recipes Limits</h3>
            <pre className="text-xs overflow-auto bg-white p-3 rounded border">
              {JSON.stringify(data.recipesLimits, null, 2)}
            </pre>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-blue-900">What to Check:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>
                <strong>subscriptionTier</strong> should be "professional" for paid tier
              </li>
              <li>
                <strong>subscriptionStatus</strong> should be "active" for paid tier
              </li>
              <li>
                <strong>subscriptionEndsAt</strong> should be a future date (or 2099 for lifetime)
              </li>
              <li>
                All modules should show <strong>unlocked: true</strong> for paid tier
              </li>
              <li>
                Check browser console for detailed logs from <code>[isPaidTier]</code> and{" "}
                <code>[Unlock Status]</code>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
