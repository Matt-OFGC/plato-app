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

interface Shift {
  id: number;
  membershipId: number;
  companyId: number;
  date: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  shiftType: string;
  location: string | null;
  status: string;
  notes: string | null;
  membership: {
    user: {
      name: string | null;
      email: string;
    };
  };
}

interface RosterCalendarProps {
  companyId: number;
  canManageAll: boolean;
  members: Member[];
}

export default function RosterCalendar({ companyId, canManageAll, members }: RosterCalendarProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get start of week (Sunday)
  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const [weekStart, setWeekStart] = useState(getWeekStart(selectedDate));

  useEffect(() => {
    loadShifts();
  }, [weekStart]);

  async function loadShifts() {
    try {
      const startDate = weekStart.toISOString().split('T')[0];
      const endDate = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const res = await fetch(`/api/staff/shifts?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      
      setShifts(data.shifts || []);
    } catch (error) {
      console.error("Failed to load shifts:", error);
    } finally {
      setLoading(false);
    }
  }

  function getDayShifts(date: Date) {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.filter(s => {
      const shiftDate = new Date(s.date);
      const shiftDateStr = shiftDate.toISOString().split('T')[0];
      return shiftDateStr === dateStr;
    });
  }

  function nextWeek() {
    setWeekStart(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000));
  }

  function prevWeek() {
    setWeekStart(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000));
  }

  function formatTime(timeString: string) {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function getShiftTypeColor(shiftType: string) {
    const colors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
      general: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        badge: 'bg-blue-100 text-blue-800'
      },
      opening: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-900',
        badge: 'bg-amber-100 text-amber-800'
      },
      closing: {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        text: 'text-indigo-900',
        badge: 'bg-indigo-100 text-indigo-800'
      },
      production: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-900',
        badge: 'bg-green-100 text-green-800'
      },
      service: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-900',
        badge: 'bg-purple-100 text-purple-800'
      }
    };
    return colors[shiftType] || colors.general;
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    return day;
  });

  if (loading) {
    return <div className="text-center py-8">Loading roster...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Modern Week Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={prevWeek}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Previous</span>
            </button>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">
                {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h2>
              <p className="text-sm text-gray-500 mt-1">Weekly Schedule</p>
            </div>
            <button
              onClick={nextWeek}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <span className="font-medium">Next</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {canManageAll && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-semibold">Create Shift</span>
            </button>
          )}
        </div>
      </div>

      {/* Create Shift Form */}
      {showCreateForm && canManageAll && (
        <CreateShiftForm
          members={members}
          companyId={companyId}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            loadShifts();
            setShowCreateForm(false);
          }}
        />
      )}

      {/* Shift Type Legend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Shift Types</h3>
        <div className="flex flex-wrap gap-3">
          {['general', 'opening', 'closing', 'production', 'service'].map((type) => {
            const colors = getShiftTypeColor(type);
            return (
              <div key={type} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${colors.badge}`}></div>
                <span className="text-sm text-gray-600 capitalize">{type}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Calendar Grid */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-7 divide-x divide-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          {days.map((day, idx) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={idx} className={`p-4 border-b border-gray-200 ${isToday ? 'bg-blue-50' : ''}`}>
                <div className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {daysOfWeek[idx]}
                </div>
                <div className={`text-xs mt-1 ${isToday ? 'text-blue-500' : 'text-gray-600'}`}>
                  {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                {isToday && (
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full">
                      Today
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7 divide-x divide-gray-200 min-h-[500px]">
          {days.map((day, idx) => {
            const dayShifts = getDayShifts(day);
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={idx} className={`p-2 space-y-2 ${isToday ? 'bg-blue-50 bg-opacity-30' : ''}`}>
                {dayShifts.length === 0 && (
                  <div className="text-center text-gray-400 text-xs mt-4">
                    No shifts
                  </div>
                )}
                {dayShifts.map((shift) => {
                  const colors = getShiftTypeColor(shift.shiftType);
                  return (
                    <div
                      key={shift.id}
                      className={`${colors.bg} border ${colors.border} rounded-lg p-2 text-xs shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${colors.text}`}>
                          {shift.membership.user.name?.split(' ')[0] || 'Staff'}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${colors.badge}`}>
                          {shift.shiftType[0].toUpperCase()}
                        </span>
                      </div>
                      <div className={`font-semibold ${colors.text}`}>
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </div>
                      {shift.location && (
                        <div className="flex items-center mt-1 text-gray-600">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{shift.location}</span>
                        </div>
                      )}
                      {shift.breakDuration > 0 && (
                        <div className="flex items-center mt-1 text-gray-500 text-xs">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {shift.breakDuration}min break
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Create Shift Form Component
function CreateShiftForm({ members, companyId, onClose, onSuccess }: {
  members: Member[];
  companyId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    membershipId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    breakDuration: 0,
    shiftType: 'general',
    location: '',
    notes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

      const res = await fetch('/api/staff/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId: parseInt(formData.membershipId),
          date: formData.date,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          breakDuration: formData.breakDuration,
          shiftType: formData.shiftType,
          location: formData.location || null,
          notes: formData.notes || null,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create shift');
      }
    } catch (error) {
      console.error('Failed to create shift:', error);
      alert('Failed to create shift');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border-2 border-blue-200 rounded-xl shadow-lg p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Create New Shift</h3>
          <p className="text-sm text-gray-500 mt-1">Schedule a team member for work</p>
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
            Staff Member *
          </label>
          <select
            required
            value={formData.membershipId}
            onChange={(e) => setFormData({ ...formData, membershipId: e.target.value })}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            <option value="">Select a team member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.user.name || m.user.email}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Shift Type *</label>
            <select
              value={formData.shiftType}
              onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            >
              <option value="general">🔵 General</option>
              <option value="opening">🟡 Opening</option>
              <option value="closing">🟣 Closing</option>
              <option value="production">🟢 Production</option>
              <option value="service">🟣 Service</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time *</label>
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
            <input
              type="time"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Break (min)</label>
            <input
              type="number"
              value={formData.breakDuration}
              onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value) || 0 })}
              placeholder="0"
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Kitchen, Front of House, Bar"
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Add any special instructions or notes..."
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
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
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating...</span>
              </span>
            ) : (
              'Create Shift'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
