"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface App {
  id: string;
  name: string;
  icon: string;
  color: string;
  href: string;
  paths: string[];
}

export function AppSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const apps: App[] = [
    {
      id: "recipe",
      name: "Recipe App",
      icon: "🍽️",
      color: "blue",
      href: "/dashboard/recipes",
      paths: ["/dashboard/recipes", "/dashboard/ingredients", "/dashboard/recipe-mixer"],
    },
    {
      id: "staff",
      name: "Staff App",
      icon: "👥",
      color: "purple",
      href: "/dashboard/staff",
      paths: ["/dashboard/staff"],
    },
    {
      id: "wholesale",
      name: "Wholesale App",
      icon: "📦",
      color: "green",
      href: "/dashboard/wholesale",
      paths: ["/dashboard/wholesale"],
    },
  ];

  // Determine current app
  const currentApp = apps.find((app) =>
    app.paths.some((path) => pathname?.startsWith(path))
  ) || null;

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; hover: string; text: string }> = {
      blue: {
        bg: "bg-blue-100",
        hover: "hover:bg-blue-200",
        text: "text-blue-700",
      },
      purple: {
        bg: "bg-purple-100",
        hover: "hover:bg-purple-200",
        text: "text-purple-700",
      },
      green: {
        bg: "bg-green-100",
        hover: "hover:bg-green-200",
        text: "text-green-700",
      },
    };
    return colors[color] || colors.blue;
  };

  if (!currentApp) return null;

  const currentColors = getColorClasses(currentApp.color);

  return (
    <div className="relative">
      {/* Current App Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg ${currentColors.bg} ${currentColors.hover} transition-colors`}
      >
        <span className="text-2xl">{currentApp.icon}</span>
        <div className="flex-1 text-left">
          <div className={`text-sm font-bold ${currentColors.text}`}>
            {currentApp.name}
          </div>
          <div className="text-xs text-gray-500">Current App</div>
        </div>
        <svg
          className={`w-4 h-4 ${currentColors.text} transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Menu */}
          <div className="absolute left-0 right-0 mt-2 z-40 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-2 space-y-1">
              {apps.map((app) => {
                const colors = getColorClasses(app.color);
                const isCurrent = app.id === currentApp.id;

                return (
                  <button
                    key={app.id}
                    onClick={() => {
                      router.push(app.href);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isCurrent
                        ? `${colors.bg} ${colors.text}`
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-2xl">{app.icon}</span>
                    <div className="flex-1 text-left">
                      <div
                        className={`text-sm font-semibold ${
                          isCurrent ? colors.text : "text-gray-900"
                        }`}
                      >
                        {app.name}
                      </div>
                    </div>
                    {isCurrent && (
                      <svg
                        className={`w-5 h-5 ${colors.text}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-3 bg-gray-50">
              <button
                onClick={() => {
                  router.push("/dashboard");
                  setIsOpen(false);
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium text-left"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
