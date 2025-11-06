"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ActivityItem } from "@/lib/services/activityService";

interface StaffActivityContextType {
  activities: ActivityItem[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const StaffActivityContext = createContext<StaffActivityContextType | undefined>(
  undefined
);

export function StaffActivityProvider({
  companyId,
  membershipId,
  children,
}: {
  companyId?: number;
  membershipId?: number;
  children: ReactNode;
}) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [companyId, membershipId]);

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

  return (
    <StaffActivityContext.Provider
      value={{
        activities,
        loading,
        refresh: loadActivities,
      }}
    >
      {children}
    </StaffActivityContext.Provider>
  );
}

export function useStaffActivity() {
  const context = useContext(StaffActivityContext);
  if (context === undefined) {
    throw new Error("useStaffActivity must be used within StaffActivityProvider");
  }
  return context;
}

