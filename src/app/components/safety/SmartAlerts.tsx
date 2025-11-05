"use client";

import { useState, useEffect } from "react";

export function SmartAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  async function loadAlerts() {
    setLoading(true);
    try {
      const url = filter !== "all" ? `/api/safety/alerts?severity=${filter}` : "/api/safety/alerts";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(alertId: number) {
    try {
      const response = await fetch(`/api/safety/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setAlerts(alerts.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)));
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }

  async function dismissAlert(alertId: number) {
    try {
      const response = await fetch(`/api/safety/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDismissed: true }),
      });

      if (response.ok) {
        setAlerts(alerts.filter((a) => a.id !== alertId));
      }
    } catch (error) {
      console.error("Failed to dismiss alert:", error);
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

  function getSeverityIcon(severity: string) {
    switch (severity) {
      case "urgent":
        return "🚨";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📢";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Smart Alerts</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("urgent")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === "urgent"
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Urgent
          </button>
          <button
            onClick={() => setFilter("warning")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === "warning"
                ? "bg-yellow-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Warning
          </button>
          <button
            onClick={() => setFilter("info")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === "info"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Info
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No alerts</h3>
          <p className="text-gray-600">All systems are running smoothly!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-2xl border-2 p-4 ${
                !alert.isRead ? getSeverityColor(alert.severity) : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                    <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                    {!alert.isRead && (
                      <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-2">{alert.message}</p>
                  {alert.actionRequired && (
                    <p className="text-sm text-gray-600 italic">
                      Action: {alert.actionRequired}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {!alert.isRead && (
                    <button
                      onClick={() => markAsRead(alert.id)}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

