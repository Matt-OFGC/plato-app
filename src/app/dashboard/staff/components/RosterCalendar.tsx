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
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={prevWeek}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Prev
          </button>
          <h2 className="text-lg font-semibold">
            {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
            {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </h2>
          <button
            onClick={nextWeek}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Next →
          </button>
        </div>

        {canManageAll && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Create Shift
          </button>
        )}
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

      {/* Calendar Grid */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 divide-x divide-gray-200">
          {days.map((day, idx) => (
            <div key={idx} className="p-4 border-b border-gray-200">
              <div className="text-sm font-semibold text-gray-900">
                {daysOfWeek[idx]}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-gray-200 min-h-[400px]">
          {days.map((day, idx) => {
            const dayShifts = getDayShifts(day);
            return (
              <div key={idx} className="p-2 space-y-1">
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="bg-blue-50 border border-blue-200 rounded px-2 py-1 text-xs"
                  >
                    <div className="font-medium text-blue-900">
                      {shift.membership.user.name || shift.membership.user.email}
                    </div>
                    <div className="text-blue-700">
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </div>
                    {shift.location && (
                      <div className="text-blue-600">{shift.location}</div>
                    )}
                  </div>
                ))}
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
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Create Shift</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Staff Member
          </label>
          <select
            required
            value={formData.membershipId}
            onChange={(e) => setFormData({ ...formData, membershipId: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Select member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.user.name || m.user.email}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shift Type</label>
            <select
              value={formData.shiftType}
              onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="general">General</option>
              <option value="opening">Opening</option>
              <option value="closing">Closing</option>
              <option value="production">Production</option>
              <option value="service">Service</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input
              type="time"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Break (minutes)</label>
          <input
            type="number"
            value={formData.breakDuration}
            onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value) || 0 })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Kitchen, Front of House"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
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
            {loading ? 'Creating...' : 'Create Shift'}
          </button>
        </div>
      </form>
    </div>
  );
}
