"use client";

import { useState } from "react";
import Link from "next/link";

interface TrainingDashboardClientProps {
  modules: any[];
  companyId: number;
}

export default function TrainingDashboardClient({
  modules,
  companyId,
}: TrainingDashboardClientProps) {
  const [filter, setFilter] = useState<"all" | "template" | "custom">("all");

  const filteredModules = modules.filter((module) => {
    if (filter === "template") return module.isTemplate;
    if (filter === "custom") return !module.isTemplate;
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Training Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage training modules and track staff progress
            </p>
          </div>
          <Link
            href="/dashboard/training/modules/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all duration-200 shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Module
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Modules</h3>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-accent)]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900">{modules.length}</p>
          <p className="text-sm text-gray-600 mt-1">training modules</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Templates</h3>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900">{modules.filter(m => m.isTemplate).length}</p>
          <p className="text-sm text-gray-600 mt-1">template modules</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Custom Modules</h3>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900">{modules.filter(m => !m.isTemplate).length}</p>
          <p className="text-sm text-gray-600 mt-1">custom modules</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter("all")}
            className={`
              px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap text-sm font-medium
              ${
                filter === "all"
                  ? "bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            All Modules
          </button>
          <button
            onClick={() => setFilter("template")}
            className={`
              px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap text-sm font-medium
              ${
                filter === "template"
                  ? "bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            Templates
          </button>
          <button
            onClick={() => setFilter("custom")}
            className={`
              px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap text-sm font-medium
              ${
                filter === "custom"
                  ? "bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Modules List */}
      {filteredModules.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">No training modules found.</p>
          <Link
            href="/dashboard/training/modules/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Module
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredModules.map((module) => (
            <Link
              key={module.id}
              href={`/dashboard/training/modules/${module.id}`}
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 hover:shadow-xl hover:border-[var(--brand-primary)]/50 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-[var(--brand-primary)] transition-colors flex-1 pr-2">
                  {module.title}
                </h3>
                {module.isTemplate && (
                  <span className="px-3 py-1 text-xs bg-blue-500/10 text-blue-700 border border-blue-500/20 rounded-lg font-medium flex-shrink-0">
                    Template
                  </span>
                )}
              </div>
              {module.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {module.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t border-gray-200/50">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span>{module.content?.length || 0} sections</span>
                </div>
                {module.recipes?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>{module.recipes.length} recipes</span>
                  </div>
                )}
                {module.estimatedDuration && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{module.estimatedDuration} min</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
