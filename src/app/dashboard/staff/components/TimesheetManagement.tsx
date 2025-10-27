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

interface Timesheet {
  id: number;
  membershipId: number;
  clockInAt: string;
  clockOutAt: string | null;
  totalHours: number | null;
  status: string;
  notes: string | null;
  membership: {
    user: {
      name: string | null;
      email: string;
    };
  };
}

interface TimesheetManagementProps {
  companyId: number;
  canManageAll: boolean;
  members: Member[];
}

export default function TimesheetManagement({ companyId, canManageAll, members }: TimesheetManagementProps) {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [filterMemberId, setFilterMemberId] = useState("");

  useEffect(() => {
    loadTimesheets();
  }, [filterStatus, filterMemberId]);

  async function loadTimesheets() {
    try {
      let url = `/api/staff/timesheets?status=${filterStatus}`;
      if (filterMemberId) {
        url += `&membershipId=${filterMemberId}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setTimesheets(data.timesheets || []);
    } catch (error) {
      console.error("Failed to load timesheets:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: number) {
    try {
      const res = await fetch('/api/staff/timesheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });

      if (res.ok) {
        loadTimesheets();
      }
    } catch (error) {
      console.error('Failed to approve timesheet:', error);
      alert('Failed to approve timesheet');
    }
  }

  async function handleReject(id: number) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const res = await fetch('/api/staff/timesheets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject', rejectionReason: reason }),
      });

      if (res.ok) {
        loadTimesheets();
      }
    } catch (error) {
      console.error('Failed to reject timesheet:', error);
      alert('Failed to reject timesheet');
    }
  }

  function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function formatHours(hours: number | null) {
    if (hours === null) return 'N/A';
    return `${hours.toFixed(2)}h`;
  }

  if (loading) {
    return <div className="text-center py-8">Loading timesheets...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Modern Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Filter Timesheets</h3>
          <button
            onClick={() => {
              setFilterStatus("pending");
              setFilterMemberId("");
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Reset Filters
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            >
              <option value="pending">⏳ Pending</option>
              <option value="approved">✅ Approved</option>
              <option value="rejected">❌ Rejected</option>
              <option value="">📋 All Statuses</option>
            </select>
          </div>

          {canManageAll && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Team Member
              </label>
              <select
                value={filterMemberId}
                onChange={(e) => setFilterMemberId(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="">👥 All Members</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.user.name || m.user.email}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Modern Timesheets Cards */}
      <div className="space-y-4">
        {timesheets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No timesheets found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results</p>
          </div>
        ) : (
          timesheets.map((timesheet) => (
            <div key={timesheet.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {(timesheet.membership.user.name?.[0] || timesheet.membership.user.email[0]).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {timesheet.membership.user.name || timesheet.membership.user.email}
                      </h3>
                      <p className="text-sm text-gray-500">{timesheet.membership.user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-blue-700 mb-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-xs font-semibold uppercase">Clock In</span>
                      </div>
                      <p className="text-sm font-bold text-blue-900">{formatDateTime(timesheet.clockInAt)}</p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-purple-700 mb-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-xs font-semibold uppercase">Clock Out</span>
                      </div>
                      <p className="text-sm font-bold text-purple-900">
                        {timesheet.clockOutAt ? formatDateTime(timesheet.clockOutAt) : 'Still clocked in'}
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-green-700 mb-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-semibold uppercase">Total Hours</span>
                      </div>
                      <p className="text-sm font-bold text-green-900">{formatHours(timesheet.totalHours)}</p>
                    </div>
                  </div>

                  {timesheet.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-600"><span className="font-semibold">Notes:</span> {timesheet.notes}</p>
                    </div>
                  )}
                </div>

                <div className="ml-6 flex flex-col items-end space-y-3">
                  <span
                    className={`px-4 py-2 inline-flex items-center text-sm font-bold rounded-full ${
                      timesheet.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : timesheet.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {timesheet.status === 'approved' && '✅ '}
                    {timesheet.status === 'rejected' && '❌ '}
                    {timesheet.status === 'pending' && '⏳ '}
                    {timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
                  </span>

                  {canManageAll && timesheet.status === 'pending' && (
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleApprove(timesheet.id)}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(timesheet.id)}
                        className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
