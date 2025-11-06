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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training</h1>
          <p className="text-gray-600 mt-2">
            Manage training modules and track staff progress
          </p>
        </div>
        <Link
          href="/dashboard/training/modules/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Module
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Modules
          </button>
          <button
            onClick={() => setFilter("template")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "template"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setFilter("custom")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "custom"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Modules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No training modules found.</p>
            <Link
              href="/dashboard/training/modules/new"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Module
            </Link>
          </div>
        ) : (
          filteredModules.map((module) => (
            <Link
              key={module.id}
              href={`/dashboard/training/modules/${module.id}`}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {module.title}
                </h3>
                {module.isTemplate && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                    Template
                  </span>
                )}
              </div>
              {module.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {module.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{module.content.length} sections</span>
                {module.recipes.length > 0 && (
                  <span>{module.recipes.length} recipes</span>
                )}
                {module.estimatedDuration && (
                  <span>{module.estimatedDuration} min</span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

