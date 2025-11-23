"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isNavigationItemVisible } from "@/lib/mvp-config";

interface AppCardProps {
  icon: string;
  name: string;
  description: string;
  stats: { label: string; value: string | number; trend?: string }[];
  color: string;
  href: string;
  available: boolean;
  badge?: string;
}

interface AppLauncherProps {
  recipeCount: number;
  ingredientCount: number;
  staffCount: number;
  shiftsThisWeek: number;
}

export function AppLauncher({
  recipeCount,
  ingredientCount,
  staffCount,
  shiftsThisWeek,
}: AppLauncherProps) {
  const router = useRouter();

  const allApps: AppCardProps[] = [
    {
      icon: "🍽️",
      name: "Recipe Management",
      description: "Complete recipe library with real-time costing & menu engineering analytics",
      stats: [
        { label: "Active Recipes", value: recipeCount, trend: "+12%" },
        { label: "Ingredients", value: ingredientCount, trend: "+5%" },
      ],
      color: "emerald",
      href: "/dashboard/recipes",
      available: true,
      badge: "Core",
    },
    {
      icon: "👥",
      name: "Team & Scheduling",
      description: "Team management, AI-powered scheduling, timesheets, leave tracking & payroll integration",
      stats: [
        { label: "Team Size", value: staffCount, trend: "+2" },
        { label: "Weekly Shifts", value: shiftsThisWeek, trend: "↑" },
      ],
      color: "violet",
      href: "/dashboard/team",
      available: true,
      badge: "Popular",
    },
    {
      icon: "📦",
      name: "Wholesale & Supply",
      description: "Streamlined supplier management, smart ordering & automated inventory tracking",
      stats: [
        { label: "Suppliers", value: "—", trend: "" },
        { label: "Monthly Orders", value: "—", trend: "" },
      ],
      color: "teal",
      href: "/dashboard/wholesale",
      available: false,
      badge: "Coming Soon",
    },
    {
      icon: "💬",
      name: "Team Chat",
      description: "Real-time team messaging, channels & collaboration - all within Plato",
      stats: [
        { label: "Channels", value: "3", trend: "new" },
        { label: "Messages", value: "24", trend: "today" },
      ],
      color: "indigo",
      href: "/dashboard/messages",
      available: true,
      badge: "New",
    },
  ];

  // Filter apps based on MVP mode
  const apps = allApps.filter(app => {
    // Map hrefs to navigation item values
    const hrefToValue: Record<string, string> = {
      '/dashboard/recipes': 'recipes',
      '/dashboard/team': 'team',
      '/dashboard/wholesale': 'wholesale',
      '/dashboard/messages': 'messages',
    };
    const value = hrefToValue[app.href];
    if (value) {
      return isNavigationItemVisible(value);
    }
    // If not in map, show it (e.g., dashboard)
    return true;
  });

  return (
    <div className="space-y-8 mb-12">
      {/* Modern Header with Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-8 shadow-2xl">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              Welcome to Plato
            </h1>
            <p className="text-emerald-50 text-lg">
              Your all-in-one platform for restaurant management excellence
            </p>
          </div>

          {/* Status Badge */}
          <div className="hidden md:flex items-center space-x-3 bg-white bg-opacity-20 backdrop-blur-md rounded-2xl px-6 py-3 border border-white border-opacity-30">
            <div className="flex -space-x-2">
              {apps.filter(a => a.available).map((app, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-2xl border-2 border-white shadow-lg"
                  style={{ zIndex: apps.length - i }}
                >
                  {app.icon}
                </div>
              ))}
            </div>
            <div>
              <div className="text-white font-bold text-lg">{apps.filter(a => a.available).length}</div>
              <div className="text-emerald-100 text-xs">Apps Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* App Cards Grid - Modern 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {apps.map((app) => (
          <AppCard key={app.name} {...app} />
        ))}
      </div>
    </div>
  );
}

function AppCard({
  icon,
  name,
  description,
  stats,
  color,
  href,
  available,
  badge,
}: AppCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const colorMap: Record<string, { gradient: string; glow: string; badge: string; stat: string }> = {
    emerald: {
      gradient: "from-emerald-500 via-green-500 to-teal-500",
      glow: "group-hover:shadow-emerald-500/50",
      badge: "bg-emerald-500",
      stat: "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200",
    },
    violet: {
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      glow: "group-hover:shadow-violet-500/50",
      badge: "bg-violet-500",
      stat: "bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200",
    },
    teal: {
      gradient: "from-teal-500 via-cyan-500 to-sky-500",
      glow: "group-hover:shadow-teal-500/50",
      badge: "bg-teal-500",
      stat: "bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200",
    },
    indigo: {
      gradient: "from-indigo-500 via-blue-500 to-cyan-500",
      glow: "group-hover:shadow-indigo-500/50",
      badge: "bg-indigo-500",
      stat: "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200",
    },
  };

  const theme = colorMap[color] || colorMap.emerald;

  const handleClick = () => {
    if (available) {
      router.push(href);
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative rounded-3xl overflow-hidden transition-all duration-500 ${
        available
          ? `cursor-pointer transform hover:scale-[1.02] hover:shadow-2xl ${theme.glow}`
          : "opacity-70 cursor-not-allowed"
      }`}
    >
      {/* Glassmorphism Container */}
      <div className="relative bg-white backdrop-blur-xl rounded-3xl border-2 border-gray-200 overflow-hidden shadow-xl">
        {/* Animated gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

        {/* Header Section */}
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            {/* Icon with 3D effect */}
            <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-3xl shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
              <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <span className="relative z-10 drop-shadow-md">{icon}</span>
            </div>

            {/* Badge */}
            {badge && (
              <div className={`${theme.badge} text-white text-xs font-bold px-3 py-1 rounded-full shadow-md ${
                badge === "New" ? "animate-pulse" : ""
              }`}>
                {badge}
              </div>
            )}
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:${theme.gradient} transition-all">
              {name}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed min-h-[60px]">
              {description}
            </p>
          </div>
        </div>

        {/* Stats Section with Modern Design */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={`relative p-4 rounded-2xl border-2 ${theme.stat} overflow-hidden transition-all duration-300 hover:scale-105`}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transform -skew-x-12 group-hover:translate-x-full transition-all duration-1000"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {stat.label}
                    </div>
                    {stat.trend && (
                      <div className="text-xs font-bold text-emerald-600">
                        {stat.trend}
                      </div>
                    )}
                  </div>
                  <div className="text-3xl font-black text-gray-900">
                    {stat.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="px-6 pb-6">
          {available ? (
            <button className={`w-full relative overflow-hidden group/btn py-4 rounded-2xl bg-gradient-to-r ${theme.gradient} text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]`}>
              {/* Button shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover/btn:opacity-20 transform -skew-x-12 group-hover/btn:translate-x-full transition-all duration-700"></div>

              <div className="relative z-10 flex items-center justify-center space-x-2">
                <span>Launch {name.split(' ')[0]}</span>
                <svg
                  className={`w-5 h-5 transform transition-transform duration-300 ${
                    isHovered ? "translate-x-1" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </button>
          ) : (
            <button
              disabled
              className="w-full py-4 rounded-2xl bg-gray-100 text-gray-400 font-bold text-lg cursor-not-allowed border-2 border-dashed border-gray-300"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Coming Soon</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
