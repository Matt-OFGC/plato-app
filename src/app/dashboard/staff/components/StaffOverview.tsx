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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Working Today</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.workingToday}</p>
          <p className="text-sm text-gray-600 mt-1">staff scheduled</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Pending Timesheets</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingTimesheets}</p>
          <p className="text-sm text-gray-600 mt-1">awaiting approval</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-500">Pending Leave</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingLeave}</p>
          <p className="text-sm text-gray-600 mt-1">requests to review</p>
        </div>
      </div>

      {/* Quick Actions */}
      {canManageAll && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Create Shift
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Approve Timesheets
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Review Leave Requests
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
