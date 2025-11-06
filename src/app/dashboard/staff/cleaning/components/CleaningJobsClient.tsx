"use client";

import { useState } from "react";
import Link from "next/link";

interface CleaningJobsClientProps {
  jobs: any[];
  members: any[];
  companyId: number;
  currentUserId: number;
}

export default function CleaningJobsClient({
  jobs,
  members,
  companyId,
  currentUserId,
}: CleaningJobsClientProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const filteredJobs = jobs.filter((job) => {
    if (filter === "pending") return !job.completedAt;
    if (filter === "completed") return job.completedAt;
    return true;
  });

  async function handleComplete(jobId: number) {
    try {
      const res = await fetch(`/api/staff/cleaning-jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to complete job");
      }
    } catch (error) {
      console.error("Failed to complete job:", error);
      alert("Failed to complete job");
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cleaning Jobs</h1>
          <p className="text-gray-600 mt-2">
            Manage cleaning job assignments and track completion
          </p>
        </div>
        <Link
          href="/dashboard/team"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Back to Team
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "all"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Jobs
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "pending"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "completed"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No cleaning jobs found.</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {job.name}
                    </h3>
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
                  {job.description && (
                    <p className="text-gray-600 mb-3">{job.description}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {job.membership && (
                      <div>
                        <span className="text-gray-500">Assigned to:</span>
                        <p className="font-medium text-gray-900">
                          {job.membership.user.name || job.membership.user.email}
                        </p>
                      </div>
                    )}
                    {job.dueDate && (
                      <div>
                        <span className="text-gray-500">Due date:</span>
                        <p className="font-medium text-gray-900">
                          {new Date(job.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {job.frequency && (
                      <div>
                        <span className="text-gray-500">Frequency:</span>
                        <p className="font-medium text-gray-900 capitalize">
                          {job.frequency}
                        </p>
                      </div>
                    )}
                    {job.productionPlan && (
                      <div>
                        <span className="text-gray-500">Production plan:</span>
                        <Link
                          href={`/dashboard/production/view/${job.productionPlan.id}`}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {job.productionPlan.name}
                        </Link>
                      </div>
                    )}
                  </div>
                  {job.completedAt && job.completedByUser && (
                    <p className="text-sm text-gray-500 mt-3">
                      Completed by {job.completedByUser.name} on{" "}
                      {new Date(job.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {!job.completedAt && (
                  <button
                    onClick={() => handleComplete(job.id)}
                    className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

