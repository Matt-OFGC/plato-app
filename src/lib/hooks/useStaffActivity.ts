"use client";

import { useState, useEffect } from "react";
import { ActivityItem } from "@/lib/services/activityService";

export function useStaffActivity(membershipId?: number, companyId?: number) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (membershipId || companyId) {
      loadActivities();
    }
  }, [membershipId, companyId]);

  async function loadActivities() {
    try {
      const url = membershipId
        ? `/api/staff/${membershipId}/activity`
        : `/api/activity?companyId=${companyId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setLoading(false);
    }
  }

  return {
    activities,
    loading,
    refresh: loadActivities,
  };
}

