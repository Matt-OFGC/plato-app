"use client";

import { useState } from "react";
import StaffOverview from "./components/StaffOverview";
import RosterCalendar from "./components/RosterCalendar";
import TimesheetManagement from "./components/TimesheetManagement";
import LeaveManagement from "./components/LeaveManagement";

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

interface StaffPageClientProps {
  companyId: number;
  currentUserRole: string;
  members: Member[];
}

export default function StaffPageClient({ 
  companyId, 
  currentUserRole, 
  members 
}: StaffPageClientProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  const canManageAll = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "roster", label: "Roster" },
    { id: "timesheets", label: "Timesheets" },
    { id: "leave", label: "Leave" },
  ];

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Staff Management</h1>
        <p className="text-blue-100">Manage your team schedules, timesheets, and leave requests</p>
      </div>

      {/* Tab Navigation - Modern Style */}
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
