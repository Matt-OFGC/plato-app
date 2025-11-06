"use client";

import { ActivityItem } from "@/lib/services/activityService";
import { useStaffActivity } from "@/lib/hooks/useStaffActivity";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  membershipId?: number;
  companyId?: number;
  limit?: number;
}

export function ActivityFeed({
  membershipId,
  companyId,
  limit = 20,
}: ActivityFeedProps) {
  const { activities, loading } = useStaffActivity(membershipId, companyId);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Activity Feed</h3>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Activity Feed</h3>
        <p className="text-sm text-gray-500">No recent activity</p>
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    if (action.includes("completed")) return "✅";
    if (action.includes("created")) return "➕";
    if (action.includes("updated")) return "✏️";
    if (action.includes("assigned")) return "📋";
    return "📌";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Activity Feed</h3>
      <div className="space-y-3">
        {activities.slice(0, limit).map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg">{getActionIcon(activity.action)}</span>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{activity.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                {activity.userName || "System"} •{" "}
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

