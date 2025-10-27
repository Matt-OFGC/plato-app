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

interface LeaveRequest {
  id: number;
  membershipId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  isFullDay: boolean;
  status: string;
  reason: string | null;
  notes: string | null;
  membership: {
    user: {
      name: string | null;
      email: string;
    };
  };
}

interface LeaveManagementProps {
  companyId: number;
  canManageAll: boolean;
  members: Member[];
}

export default function LeaveManagement({ companyId, canManageAll, members }: LeaveManagementProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const currentMember = members[0]; // In real app, get from session

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  async function loadLeaveRequests() {
    try {
      const res = await fetch('/api/staff/leave');
      const data = await res.json();
      setLeaveRequests(data.leaveRequests || []);
    } catch (error) {
      console.error("Failed to load leave requests:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: number) {
    try {
      const res = await fetch('/api/staff/leave', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });

      if (res.ok) {
        loadLeaveRequests();
      }
    } catch (error) {
      console.error('Failed to approve leave request:', error);
      alert('Failed to approve leave request');
    }
  }

  async function handleReject(id: number) {
    const reviewNotes = prompt('Enter review notes:');
    if (!reviewNotes) return;

    try {
      const res = await fetch('/api/staff/leave', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject', reviewNotes }),
      });

      if (res.ok) {
        loadLeaveRequests();
      }
    } catch (error) {
      console.error('Failed to reject leave request:', error);
      alert('Failed to reject leave request');
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (loading) {
    return <div className="text-center py-8">Loading leave requests...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Request Leave Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Leave Requests</h2>
        <button
          onClick={() => setShowRequestForm(!showRequestForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Request Leave
        </button>
      </div>

      {/* Request Leave Form */}
      {showRequestForm && (
        <LeaveRequestForm
          members={members}
          companyId={companyId}
          onClose={() => setShowRequestForm(false)}
          onSuccess={() => {
            loadLeaveRequests();
            setShowRequestForm(false);
          }}
        />
      )}

      {/* Leave Requests List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
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
              {leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={canManageAll ? 6 : 5} className="px-6 py-4 text-center text-gray-500">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                leaveRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.membership.user.name || request.membership.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.leaveType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    {canManageAll && request.status === 'pending' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </td>
                    )}
                    {canManageAll && request.status !== 'pending' && (
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

// Leave Request Form Component
function LeaveRequestForm({ members, companyId, onClose, onSuccess }: {
  members: Member[];
  companyId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    membershipId: members[0]?.id || '',
    leaveType: 'vacation',
    startDate: '',
    endDate: '',
    isFullDay: true,
    reason: '',
    notes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/staff/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId: parseInt(formData.membershipId),
          leaveType: formData.leaveType,
          startDate: formData.startDate,
          endDate: formData.endDate,
          isFullDay: formData.isFullDay,
          reason: formData.reason || null,
          notes: formData.notes || null,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Failed to submit leave request:', error);
      alert('Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Request Leave</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Leave Type
          </label>
          <select
            required
            value={formData.leaveType}
            onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="vacation">Vacation</option>
            <option value="sick">Sick Leave</option>
            <option value="personal">Personal</option>
            <option value="unpaid">Unpaid Leave</option>
            <option value="public_holiday">Public Holiday</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Brief reason for leave request"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
