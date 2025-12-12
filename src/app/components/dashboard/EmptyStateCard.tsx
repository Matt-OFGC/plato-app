"use client";

interface EmptyStateCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  priority?: 1 | 2 | 3; // Priority order for new users
  secondaryAction?: {
    label: string;
    href: string;
  };
}

export function EmptyStateCard({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryAction,
}: EmptyStateCardProps) {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-emerald-400 transition-all duration-300 hover:shadow-lg group">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mb-4 group-hover:bg-emerald-100 transition-colors">
        {icon}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
        {description}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={actionHref}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md"
        >
          {actionLabel}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>

        {secondaryAction && (
          <a
            href={secondaryAction.href}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            {secondaryAction.label}
          </a>
        )}
      </div>
    </div>
  );
}

export function QuickStartCard() {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-emerald-900 mb-2">
            Quick Start Guide
          </h3>
          <p className="text-sm text-emerald-800 mb-4">
            Get your kitchen up and running in just 3 simple steps:
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </div>
              <span className="text-emerald-900 font-medium">
                Add 3-5 common ingredients
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </div>
              <span className="text-emerald-900 font-medium">
                Create your first recipe
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </div>
              <span className="text-emerald-900 font-medium">
                Invite your team members
              </span>
            </div>
          </div>

          <a
            href="/dashboard/onboarding"
            className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Start guided setup
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
