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

  function getLeaveTypeIcon(leaveType: string) {
    const icons: Record<string, string> = {
      vacation: '🏖️',
      sick: '🤒',
      personal: '🏠',
      unpaid: '💼',
      public_holiday: '🎉'
    };
    return icons[leaveType] || '📅';
  }

  function getLeaveTypeColor(leaveType: string) {
    const colors: Record<string, string> = {
      vacation: 'bg-blue-100 text-blue-800',
      sick: 'bg-red-100 text-red-800',
      personal: 'bg-purple-100 text-purple-800',
      unpaid: 'bg-gray-100 text-gray-800',
      public_holiday: 'bg-green-100 text-green-800'
    };
    return colors[leaveType] || 'bg-gray-100 text-gray-800';
  }

  return (
    <div className="space-y-6">
      {/* Modern Header with Request Button */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Leave Requests</h2>
            <p className="text-sm text-gray-500 mt-1">Manage time off and leave requests</p>
          </div>
          <button
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-semibold">Request Leave</span>
          </button>
        </div>
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

      {/* Modern Leave Requests Cards */}
      <div className="space-y-4">
        {leaveRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No leave requests</h3>
            <p className="text-gray-500">Click "Request Leave" to submit a new request</p>
          </div>
        ) : (
          leaveRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {(request.membership.user.name?.[0] || request.membership.user.email[0]).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {request.membership.user.name || request.membership.user.email}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getLeaveTypeColor(request.leaveType)}`}>
                          {getLeaveTypeIcon(request.leaveType)} {request.leaveType.replace('_', ' ').toUpperCase()}
                        </span>
                        {request.isFullDay && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                            Full Day
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-blue-700 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-bold uppercase">Start Date</span>
                      </div>
                      <p className="text-lg font-bold text-blue-900">{formatDate(request.startDate)}</p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-purple-700 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-bold uppercase">End Date</span>
                      </div>
                      <p className="text-lg font-bold text-purple-900">{formatDate(request.endDate)}</p>
                    </div>
                  </div>

                  {request.reason && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Reason:</p>
                      <p className="text-sm text-gray-600">{request.reason}</p>
                    </div>
                  )}

                  {request.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Additional Notes:</p>
                      <p className="text-sm text-gray-600">{request.notes}</p>
                    </div>
                  )}
                </div>

                <div className="ml-6 flex flex-col items-end space-y-3">
                  <span
                    className={`px-4 py-2 inline-flex items-center text-sm font-bold rounded-full ${
                      request.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {request.status === 'approved' && '✅ '}
                    {request.status === 'rejected' && '❌ '}
                    {request.status === 'pending' && '⏳ '}
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>

                  {canManageAll && request.status === 'pending' && (
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
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
    <div className="bg-white border-2 border-purple-200 rounded-xl shadow-lg p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Request Leave</h3>
          <p className="text-sm text-gray-500 mt-1">Submit a time off request</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Leave Type *
          </label>
          <select
            required
            value={formData.leaveType}
            onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
          >
            <option value="vacation">🏖️ Vacation</option>
            <option value="sick">🤒 Sick Leave</option>
            <option value="personal">🏠 Personal</option>
            <option value="unpaid">💼 Unpaid Leave</option>
            <option value="public_holiday">🎉 Public Holiday</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
            <input
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
          <input
            type="checkbox"
            id="isFullDay"
            checked={formData.isFullDay}
            onChange={(e) => setFormData({ ...formData, isFullDay: e.target.checked })}
            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
          />
          <label htmlFor="isFullDay" className="text-sm font-semibold text-gray-700 cursor-pointer">
            Full Day Leave
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            rows={3}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
            placeholder="Brief reason for leave request..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
            placeholder="Any additional information..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Submitting...</span>
              </span>
            ) : (
              'Submit Request'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
