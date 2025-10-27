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
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="">All</option>
            </select>
          </div>

          {canManageAll && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Member
              </label>
              <select
                value={filterMemberId}
                onChange={(e) => setFilterMemberId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Members</option>
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

      {/* Timesheets Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {canManageAll && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timesheets.length === 0 ? (
                <tr>
                  <td colSpan={canManageAll ? 6 : 5} className="px-6 py-4 text-center text-gray-500">
                    No timesheets found
                  </td>
                </tr>
              ) : (
                timesheets.map((timesheet) => (
                  <tr key={timesheet.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {timesheet.membership.user.name || timesheet.membership.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(timesheet.clockInAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {timesheet.clockOutAt ? formatDateTime(timesheet.clockOutAt) : 'Still clocked in'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatHours(timesheet.totalHours)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          timesheet.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : timesheet.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {timesheet.status}
                      </span>
                    </td>
                    {canManageAll && timesheet.status === 'pending' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleApprove(timesheet.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(timesheet.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </td>
                    )}
                    {canManageAll && timesheet.status !== 'pending' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        -
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
