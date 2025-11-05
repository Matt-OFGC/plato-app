"use client";

import { useState, useEffect } from "react";

export function AIInsights() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights() {
    setLoading(true);
    try {
      const response = await fetch("/api/safety/insights");
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (error) {
      console.error("Failed to load insights:", error);
    } finally {
      setLoading(false);
    }
  }

  function getInsightIcon(type: string) {
    switch (type) {
      case "efficiency":
        return "⚡";
      case "compliance":
        return "🛡️";
      case "pattern":
        return "📊";
      case "positive":
        return "✨";
      default:
        return "💡";
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-300";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "info":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Analyzing insights...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
        <button
          onClick={loadInsights}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No insights yet</h3>
          <p className="text-gray-600">
            Insights will appear here as you complete more tasks and build data.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl border-2 p-6 ${getSeverityColor(insight.severity)}`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{getInsightIcon(insight.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{insight.title}</h3>
                    <span className="px-2 py-1 bg-white/50 rounded-lg text-xs font-medium">
                      {insight.type}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{insight.message}</p>
                  <div className="bg-white/50 rounded-xl p-3 mb-3">
                    <p className="text-sm font-medium text-gray-900 mb-1">Recommendation:</p>
                    <p className="text-sm text-gray-700">{insight.recommendation}</p>
                  </div>
                  {insight.impact && insight.impact !== "positive" && (
                    <div className="text-xs text-gray-600">
                      Impact: <span className="font-medium capitalize">{insight.impact}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

