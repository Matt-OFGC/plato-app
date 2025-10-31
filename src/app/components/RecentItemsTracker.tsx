"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { addRecentItem } from "../lib/recent-items";

interface RecentItemsTrackerProps {
  id: number;
  type: "recipe" | "ingredient";
  name: string;
}

export function RecentItemsTracker({ id, type, name }: RecentItemsTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (id && name && pathname) {
      addRecentItem({
        id,
        type,
        name,
        url: pathname,
      });
    }
  }, [id, type, name, pathname]);

  return null;
}

