"use client";

import { useState, useEffect } from "react";

interface Activity {
  id: number;
  action: string;
  entity: string;
  entityId: number | null;
  entityName: string | null;
  user: {
    id: number;
    name: string | null;
    email: string;
  } | null;
  timestamp: string;
  details: any;
}

interface Props {
  companyId: number;
  filter?: string;
  limit?: number;
}

export function CompanyActivityFeed({ companyId, filter = "all", limit = 50 }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState(filter);

  useEffect(() => {
    fetchActivities();
  }, [companyId, selectedFilter]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        companyId: companyId.toString(),
        filter: selectedFilter,
        limit: limit.toString(),
      });

      const res = await fetch(`/api/companies/activity?${params}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAction = (action: string, entity: string): string => {
    const actionMap: Record<string, string> = {
      CREATE: "created",
      UPDATE: "updated",
      DELETE: "deleted",
      ACTIVATE: "activated",
      DEACTIVATE: "deactivated",
      AUTO_REPAIR: "auto-repaired",
    };

    return `${actionMap[action] || action.toLowerCase()} ${entity.toLowerCase()}`;
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading activity...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: "all", label: "All" },
          { id: "recipes", label: "Recipes" },
          { id: "ingredients", label: "Ingredients" },
          { id: "team", label: "Team" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedFilter === tab.id
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No activity to show</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-emerald-700">
                  {activity.user?.name?.charAt(0)?.toUpperCase() || 
                   activity.user?.email?.charAt(0)?.toUpperCase() || 
                   "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900">
                  <span className="font-medium">
                    {activity.user?.name || activity.user?.email || "System"}
                  </span>{" "}
                  {formatAction(activity.action, activity.entity)}
                  {activity.entityName && (
                    <span className="font-medium"> "{activity.entityName}"</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatTime(activity.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
