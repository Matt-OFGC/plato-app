"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getRecentItems, removeRecentItem, type RecentItem } from "../lib/recent-items";

export function RecentItemsPanel() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setRecentItems(getRecentItems());
  }, [pathname]);

  const handleRemove = (id: number, type: "recipe" | "ingredient") => {
    removeRecentItem(id, type);
    setRecentItems(getRecentItems());
  };

  if (recentItems.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Items
        </h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-2">
          {recentItems.slice(0, 5).map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-center justify-between group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Link
                href={item.url}
                className="flex-1 min-w-0 flex items-center gap-2"
              >
                <div className={`w-2 h-2 rounded-full ${
                  item.type === "recipe" ? "bg-emerald-500" : "bg-blue-500"
                }`} />
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {item.name}
                </span>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleRemove(item.id, item.type);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                aria-label="Remove from recent"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {recentItems.length > 5 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
              +{recentItems.length - 5} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}

