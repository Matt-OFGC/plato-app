"use client";

import { useEffect, useState } from "react";

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

interface StaffOverviewProps {
  companyId: number;
  canManageAll: boolean;
  members: Member[];
}

export default function StaffOverview({ companyId, canManageAll, members }: StaffOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    workingToday: 0,
    pendingTimesheets: 0,
    pendingLeave: 0,
  });

  useEffect(() => {
    loadOverview();
  }, [companyId]);

  async function loadOverview() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get shifts for today
      const shiftsRes = await fetch(`/api/staff/shifts?startDate=${today}&endDate=${today}`);
      const shiftsData = await shiftsRes.json();
      
      // Get pending timesheets
      const timesheetsRes = await fetch(`/api/staff/timesheets?status=pending`);
      const timesheetsData = await timesheetsRes.json();
      
      // Get pending leave
      const leaveRes = await fetch(`/api/staff/leave?status=pending`);
      const leaveData = await leaveRes.json();
      
      setStats({
        workingToday: shiftsData.shifts?.length || 0,
        pendingTimesheets: timesheetsData.timesheets?.length || 0,
        pendingLeave: leaveData.leaveRequests?.length || 0,
      });
    } catch (error) {
      console.error("Failed to load overview:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Modern Stats Cards with Gradient Backgrounds */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-100 uppercase tracking-wide">Working Today</h3>
              <p className="text-4xl font-bold mt-2">{stats.workingToday}</p>
              <p className="text-sm text-blue-100 mt-1">staff scheduled</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-amber-100 uppercase tracking-wide">Pending Timesheets</h3>
              <p className="text-4xl font-bold mt-2">{stats.pendingTimesheets}</p>
              <p className="text-sm text-amber-100 mt-1">awaiting approval</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-purple-100 uppercase tracking-wide">Pending Leave</h3>
              <p className="text-4xl font-bold mt-2">{stats.pendingLeave}</p>
              <p className="text-sm text-purple-100 mt-1">requests to review</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions with Modern Card Design */}
      {canManageAll && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-500 mt-1">Common management tasks</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-semibold">Create Shift</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">Approve Timesheets</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-semibold">Review Leave</span>
            </button>
          </div>
        </div>
      )}

      {/* Team Activity Feed */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">System</span> - Activity feed coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
