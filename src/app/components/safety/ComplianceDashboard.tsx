"use client";

import { useState, useEffect } from "react";

export function ComplianceDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load compliance stats
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    // TODO: Implement API endpoint for compliance stats
    setTimeout(() => {
      setStats({
        overallScore: 95,
        foodSafety: 98,
        healthSafety: 92,
        cleaning: 96,
        equipment: 94,
        recentActivity: [],
        upcomingTasks: { today: 5, overdue: 1, thisWeek: 12 },
      });
      setLoading(false);
    }, 500);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading compliance data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>

      {/* Overall Score */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl border border-green-200 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-700 mb-2">Overall Compliance Score</h2>
            <div className="text-6xl font-bold text-green-600">{stats?.overallScore || 0}%</div>
          </div>
          <div className="text-6xl">🛡️</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Food Safety</div>
          <div className="text-3xl font-bold text-orange-600">{stats?.foodSafety || 0}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-orange-500 h-2 rounded-full"
              style={{ width: `${stats?.foodSafety || 0}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Health & Safety</div>
          <div className="text-3xl font-bold text-blue-600">{stats?.healthSafety || 0}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${stats?.healthSafety || 0}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Cleaning</div>
          <div className="text-3xl font-bold text-green-600">{stats?.cleaning || 0}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${stats?.cleaning || 0}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Equipment</div>
          <div className="text-3xl font-bold text-purple-600">{stats?.equipment || 0}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-purple-500 h-2 rounded-full"
              style={{ width: `${stats?.equipment || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Tasks</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {stats?.upcomingTasks?.today || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Due Today</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {stats?.upcomingTasks?.overdue || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">
              {stats?.upcomingTasks?.thisWeek || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">This Week</div>
          </div>
        </div>
      </div>
    </div>
  );
}

