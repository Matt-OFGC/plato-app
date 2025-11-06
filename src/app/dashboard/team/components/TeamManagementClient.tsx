"use client";

import { useState } from "react";
import Link from "next/link";

interface Member {
  id: number;
  userId: number;
  companyId: number;
  role: string;
  isActive: boolean;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  staffProfile?: any;
}

interface TeamManagementClientProps {
  companyId: number;
  currentUserRole: string;
  members: Member[];
}

export default function TeamManagementClient({
  companyId,
  currentUserRole,
  members,
}: TeamManagementClientProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const canManageAll = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const tabs: Array<{ id: string; label: string; icon?: string }> = [
    { id: "overview", label: "Overview" },
    { id: "profiles", label: "Team Profiles" },
    { id: "training", label: "Training" },
    { id: "cleaning", label: "Cleaning Jobs" },
  ];

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Team Management</h1>
        <p className="text-blue-100">Manage team members, training, and job assignments</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <nav className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200
                ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-md transform scale-105"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
            >
              {tab.icon && <span className="mr-1">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-sm font-medium text-blue-100 uppercase tracking-wide">Team Members</h3>
              <p className="text-4xl font-bold mt-2">{members.length}</p>
              <p className="text-sm text-blue-100 mt-1">active members</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-sm font-medium text-purple-100 uppercase tracking-wide">Quick Actions</h3>
              <div className="mt-4 space-y-2">
                <Link
                  href="/dashboard/scheduling"
                  className="block px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors text-sm"
                >
                  View Schedule
                </Link>
                <Link
                  href="/dashboard/training"
                  className="block px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors text-sm"
                >
                  Manage Training
                </Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-sm font-medium text-green-100 uppercase tracking-wide">Team Activity</h3>
              <p className="text-sm text-green-100 mt-2">View recent team activity and updates</p>
            </div>
          </div>
        )}

        {activeTab === "profiles" && (
          <div className="space-y-4">
            {members.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No team members found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                  <Link
                    key={member.id}
                    href={`/dashboard/team/${member.id}`}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {member.user.name || "Team Member"}
                        </h3>
                        <p className="text-sm text-gray-600">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {member.role}
                      </span>
                      {member.staffProfile && (
                        <span className="text-gray-500">Profile</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "training" && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">Training Management</h2>
              <p className="text-gray-600 mt-1">View and manage team training records</p>
            </div>
            <Link
              href="/dashboard/training"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Training Dashboard
            </Link>
          </div>
        )}

        {activeTab === "cleaning" && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">Cleaning Jobs</h2>
              <p className="text-gray-600 mt-1">Manage cleaning job assignments</p>
            </div>
            <Link
              href="/dashboard/team/cleaning"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              View Cleaning Jobs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

