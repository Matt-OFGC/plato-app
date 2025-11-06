"use client";

import { useState } from "react";
import Link from "next/link";

interface StaffProfileClientProps {
  membership: any;
  profile: any;
  trainingRecords: any[];
  cleaningJobs: any[];
  productionAssignments: any[];
  timesheets: any[];
  currentUserId: number;
}

export default function StaffProfileClient({
  membership,
  profile,
  trainingRecords,
  cleaningJobs,
  productionAssignments,
  timesheets,
  currentUserId,
}: StaffProfileClientProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "training", label: "Training" },
    { id: "cleaning", label: "Cleaning Jobs" },
    { id: "production", label: "Production" },
    { id: "timesheets", label: "Timesheets" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {membership.user.name || "Staff Member"}
            </h1>
            <p className="text-gray-600 mt-1">{membership.user.email}</p>
            {profile && (
              <div className="mt-2 flex gap-4 text-sm text-gray-500">
                {profile.position && (
                  <span>Position: {profile.position}</span>
                )}
                {profile.employmentStartDate && (
                  <span>
                    Started:{" "}
                    {new Date(profile.employmentStartDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
          <Link
            href="/dashboard/team"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Team
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
                {tab.id === "training" && trainingRecords.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                    {trainingRecords.length}
                  </span>
                )}
                {tab.id === "cleaning" && cleaningJobs.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                    {cleaningJobs.length}
                  </span>
                )}
                {tab.id === "production" && productionAssignments.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                    {productionAssignments.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900">Training</h3>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {trainingRecords.filter((r) => r.status === "completed")
                      .length}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">Completed</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900">
                    Cleaning Jobs
                  </h3>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {cleaningJobs.filter((j) => j.completedAt).length}
                  </p>
                  <p className="text-sm text-green-700 mt-1">Completed</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900">Production</h3>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {productionAssignments.length}
                  </p>
                  <p className="text-sm text-purple-700 mt-1">Assignments</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "training" && (
            <div className="space-y-4">
              {trainingRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No training records found.
                </p>
              ) : (
                trainingRecords.map((record) => (
                  <div
                    key={record.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {record.module.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Status:{" "}
                          <span
                            className={`font-medium ${
                              record.status === "completed"
                                ? "text-green-600"
                                : record.status === "in_progress"
                                ? "text-blue-600"
                                : "text-gray-600"
                            }`}
                          >
                            {record.status.replace("_", " ")}
                          </span>
                        </p>
                        {record.completedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Completed:{" "}
                            {new Date(record.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/dashboard/training/modules/${record.module.id}`}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        View Module
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "cleaning" && (
            <div className="space-y-4">
              {cleaningJobs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No cleaning jobs assigned.
                </p>
              ) : (
                cleaningJobs.map((job) => (
                  <div
                    key={job.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {job.name}
                        </h3>
                        {job.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {job.description}
                          </p>
                        )}
                        {job.dueDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Due: {new Date(job.dueDate).toLocaleDateString()}
                          </p>
                        )}
                        {job.completedAt && (
                          <p className="text-xs text-green-600 mt-1">
                            Completed:{" "}
                            {new Date(job.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {job.completedAt ? (
                        <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded">
                          Completed
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "production" && (
            <div className="space-y-4">
              {productionAssignments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No production assignments found.
                </p>
              ) : (
                productionAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {assignment.productionItem.recipe.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Plan: {assignment.productionItem.plan.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned:{" "}
                          {new Date(assignment.assignedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/recipes/${assignment.productionItem.recipe.id}`}
                        className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                      >
                        View Recipe
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "timesheets" && (
            <div className="space-y-4">
              {timesheets.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No timesheet records found.
                </p>
              ) : (
                timesheets.map((timesheet) => (
                  <div
                    key={timesheet.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {new Date(timesheet.clockInAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(timesheet.clockInAt).toLocaleTimeString()} -{" "}
                          {timesheet.clockOutAt
                            ? new Date(timesheet.clockOutAt).toLocaleTimeString()
                            : "In Progress"}
                        </p>
                        {timesheet.totalHours && (
                          <p className="text-xs text-gray-500 mt-1">
                            {timesheet.totalHours.toFixed(2)} hours
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

