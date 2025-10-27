"use client";

import { useRouter } from "next/navigation";

interface AppCardProps {
  icon: string;
  name: string;
  description: string;
  stats: { label: string; value: string | number }[];
  color: string;
  href: string;
  available: boolean;
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

  const apps: AppCardProps[] = [
    {
      icon: "🍽️",
      name: "Recipe App",
      description: "Manage recipes, ingredients, costing & menu engineering",
      stats: [
        { label: "Recipes", value: recipeCount },
        { label: "Ingredients", value: ingredientCount },
      ],
      color: "blue",
      href: "/dashboard/recipes",
      available: true,
    },
    {
      icon: "👥",
      name: "Staff App",
      description: "Scheduling, timesheets, leave management & payroll",
      stats: [
        { label: "Team Members", value: staffCount },
        { label: "Shifts This Week", value: shiftsThisWeek },
      ],
      color: "purple",
      href: "/dashboard/staff",
      available: true,
    },
    {
      icon: "📦",
      name: "Wholesale App",
      description: "Supplier management, orders, pricing & inventory",
      stats: [
        { label: "Suppliers", value: "—" },
        { label: "Orders", value: "—" },
      ],
      color: "green",
      href: "/dashboard/wholesale",
      available: false,
    },
  ];

  const getGradientClasses = (color: string) => {
    const gradients: Record<string, string> = {
      blue: "from-blue-500 to-blue-600",
      purple: "from-purple-500 to-purple-600",
      green: "from-green-500 to-green-600",
    };
    return gradients[color] || gradients.blue;
  };

  const getHoverClasses = (color: string) => {
    const hovers: Record<string, string> = {
      blue: "hover:from-blue-600 hover:to-blue-700",
      purple: "hover:from-purple-600 hover:to-purple-700",
      green: "hover:from-green-600 hover:to-green-700",
    };
    return hovers[color] || hovers.blue;
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Apps</h2>
          <p className="text-sm text-gray-500 mt-1">
            Choose an app to get started
          </p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-200">
          <span className="text-sm font-semibold text-gray-700">
            3 Apps Available
          </span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* App Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
}: AppCardProps) {
  const router = useRouter();

  const getGradientClasses = (color: string) => {
    const gradients: Record<string, string> = {
      blue: "from-blue-500 to-blue-600",
      purple: "from-purple-500 to-purple-600",
      green: "from-green-500 to-green-600",
    };
    return gradients[color] || gradients.blue;
  };

  const getHoverClasses = (color: string) => {
    const hovers: Record<string, string> = {
      blue: "hover:from-blue-600 hover:to-blue-700",
      purple: "hover:from-purple-600 hover:to-purple-700",
      green: "hover:from-green-600 hover:to-green-700",
    };
    return hovers[color] || hovers.blue;
  };

  const handleClick = () => {
    if (available) {
      router.push(href);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all duration-300 ${
        available
          ? "border-gray-200 hover:border-gray-300 hover:shadow-xl cursor-pointer transform hover:-translate-y-1"
          : "border-gray-200 opacity-60 cursor-not-allowed"
      }`}
    >
      {/* Header with Icon */}
      <div
        className={`bg-gradient-to-r ${getGradientClasses(color)} p-6 text-white relative`}
      >
        <div className="flex items-center justify-between">
          <div className="text-5xl">{icon}</div>
          {!available && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-bold backdrop-blur-sm">
              Coming Soon
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{name}</h3>
        <p className="text-sm text-gray-600 mb-4 min-h-[40px]">{description}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg ${
                available ? "bg-gray-50" : "bg-gray-100"
              }`}
            >
              <div className="text-xs font-semibold text-gray-500 uppercase">
                {stat.label}
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {available ? (
          <button
            className={`w-full py-3 bg-gradient-to-r ${getGradientClasses(
              color
            )} ${getHoverClasses(
              color
            )} text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2`}
          >
            <span>Open {name}</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : (
          <button
            disabled
            className="w-full py-3 bg-gray-300 text-gray-500 rounded-lg font-semibold cursor-not-allowed"
          >
            Coming Soon
          </button>
        )}
      </div>

      {/* Premium Badge for Coming Soon */}
      {!available && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10">
          <svg
            className="w-32 h-32 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      )}
    </div>
  );
}
