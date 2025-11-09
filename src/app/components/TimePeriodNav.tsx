"use client";

import { ScrollHideNav } from "./ScrollHideNav";

interface TimePeriodNavProps {
  activePeriod: string;
  onPeriodChange: (period: string) => void;
  periods?: { id: string; label: string }[];
  hideOnScroll?: boolean;
  className?: string;
}

/**
 * Time period navigation component (Overview, Today, Week, Reports, etc.)
 * Can be wrapped with scroll-hiding functionality for better UX
 */
export function TimePeriodNav({
  activePeriod,
  onPeriodChange,
  periods = [
    { id: "overview", label: "Overview" },
    { id: "today", label: "Today" },
    { id: "week", label: "Week" },
    { id: "reports", label: "Reports" },
  ],
  hideOnScroll = true,
  className = "",
}: TimePeriodNavProps) {
  const navContent = (
    <div className={`flex items-center gap-1 bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full px-2 py-2 overflow-x-auto max-md:scrollbar-hide ${className}`}>
      {periods.map((period) => (
        <button
          key={period.id}
          onClick={() => onPeriodChange(period.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
            activePeriod === period.id
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );

  if (hideOnScroll) {
    return (
      <ScrollHideNav className="sticky top-0 z-40 mb-4">
        {navContent}
      </ScrollHideNav>
    );
  }

  return <div className="sticky top-0 z-40 mb-4">{navContent}</div>;
}

