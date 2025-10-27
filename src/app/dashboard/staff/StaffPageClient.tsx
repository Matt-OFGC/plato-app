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
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
