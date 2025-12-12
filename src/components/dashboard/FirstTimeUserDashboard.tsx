"use client";

import { EmptyStateCard, QuickStartCard } from "./EmptyStateCard";

interface FirstTimeUserDashboardProps {
  userName?: string;
  companyName?: string;
  hasIngredients: boolean;
  hasRecipes: boolean;
  hasTeam: boolean;
}

export function FirstTimeUserDashboard({
  userName,
  companyName,
  hasIngredients,
  hasRecipes,
  hasTeam,
}: FirstTimeUserDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-8 border border-emerald-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Plato{userName ? `, ${userName}` : ""}!
        </h1>
        <p className="text-gray-600 text-lg">
          Let's get {companyName || "your kitchen"} set up and ready to go.
        </p>
      </div>

      {/* Quick Start Guide */}
      <QuickStartCard />

      {/* Empty State Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Ingredients */}
        {!hasIngredients && (
          <EmptyStateCard
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            }
            title="Add Your First Ingredients"
            description="Start by adding the ingredients you use most. You can always add more later."
            actionLabel="Add Ingredients"
            actionHref="/dashboard/ingredients/new"
            secondaryAction={{
              label: "Import from CSV",
              href: "/dashboard/ingredients?import=true",
            }}
            priority={1}
          />
        )}

        {/* Recipes */}
        {!hasRecipes && (
          <EmptyStateCard
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            }
            title="Create Your First Recipe"
            description="Build recipes with accurate costing and scaling. Perfect for consistency."
            actionLabel="Create Recipe"
            actionHref="/dashboard/recipes/new"
            secondaryAction={{
              label: "Browse Examples",
              href: "/dashboard/recipes?examples=true",
            }}
            priority={2}
          />
        )}

        {/* Team */}
        {!hasTeam && (
          <EmptyStateCard
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
            title="Invite Your Team"
            description="Collaborate with your kitchen staff and manage permissions."
            actionLabel="Invite Team"
            actionHref="/dashboard/team"
            priority={3}
          />
        )}
      </div>

      {/* Help & Resources */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Need Help Getting Started?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/help/getting-started"
            className="flex items-start gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div>
              <div className="font-medium text-gray-900 text-sm">Documentation</div>
              <div className="text-xs text-gray-600 mt-0.5">Step-by-step guides</div>
            </div>
          </a>

          <a
            href="/help/video-tutorials"
            className="flex items-start gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-medium text-gray-900 text-sm">Video Tutorials</div>
              <div className="text-xs text-gray-600 mt-0.5">Watch and learn</div>
            </div>
          </a>

          <a
            href="/help/contact"
            className="flex items-start gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div>
              <div className="font-medium text-gray-900 text-sm">Contact Support</div>
              <div className="text-xs text-gray-600 mt-0.5">We're here to help</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
