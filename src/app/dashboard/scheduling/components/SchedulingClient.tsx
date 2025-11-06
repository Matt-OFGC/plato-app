"use client";

import { useState } from "react";
import StaffOverview from "../../staff/components/StaffOverview";
import RosterCalendar from "../../staff/components/RosterCalendar";
import ModernScheduler from "../../staff/components/ModernScheduler";
import TimesheetManagement from "../../staff/components/TimesheetManagement";
import LeaveManagement from "../../staff/components/LeaveManagement";

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
}

interface SchedulingClientProps {
  companyId: number;
  currentUserRole: string;
  members: Member[];
}

export default function SchedulingClient({
  companyId,
  currentUserRole,
  members
}: SchedulingClientProps) {
  const [activeTab, setActiveTab] = useState("scheduler");

  const canManageAll = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const tabs: Array<{ id: string; label: string; icon?: string }> = [
    { id: "overview", label: "Overview" },
    { id: "scheduler", label: "Scheduler", icon: "⚡" },
    { id: "roster", label: "Roster (Classic)" },
    { id: "timesheets", label: "Timesheets" },
    { id: "leave", label: "Leave" },
  ];

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Scheduling</h1>
        <p className="text-green-100">Manage schedules, track time, and handle leave requests</p>
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
                    ? "bg-green-600 text-white shadow-md transform scale-105"
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
          <StaffOverview
            companyId={companyId}
            canManageAll={canManageAll}
            members={members}
          />
        )}

        {activeTab === "scheduler" && (
          <ModernScheduler
            companyId={companyId}
            canManageAll={canManageAll}
            members={members}
          />
        )}

        {activeTab === "roster" && (
          <RosterCalendar
            companyId={companyId}
            canManageAll={canManageAll}
            members={members}
          />
        )}

        {activeTab === "timesheets" && (
          <TimesheetManagement
            companyId={companyId}
            canManageAll={canManageAll}
            members={members}
          />
        )}

        {activeTab === "leave" && (
          <LeaveManagement
            companyId={companyId}
            canManageAll={canManageAll}
            members={members}
          />
        )}
      </div>
    </div>
  );
}

