"use client";

import { useState } from "react";

interface Member {
  id: number;
  user: {
    name: string | null;
    email: string;
  };
}

interface QuickShiftCreatorProps {
  member: Member;
  date: Date;
  startHour: number;
  onClose: () => void;
  onSave: (shift: {
    membershipId: number;
    date: string;
    startTime: string;
    endTime: string;
    shiftType: string;
    breakDuration: number;
  }) => void;
}

export function QuickShiftCreator({
  member,
  date,
  startHour,
  onClose,
  onSave,
}: QuickShiftCreatorProps) {
  const [startTime, setStartTime] = useState(
    `${startHour.toString().padStart(2, "0")}:00`
  );
  const [endTime, setEndTime] = useState(
    `${(startHour + 8).toString().padStart(2, "0")}:00`
  );
  const [shiftType, setShiftType] = useState("general");
  const [breakDuration, setBreakDuration] = useState(0);

  const shiftTypes = [
    { value: "general", label: "General", color: "blue" },
    { value: "opening", label: "Opening", color: "amber" },
    { value: "closing", label: "Closing", color: "indigo" },
    { value: "production", label: "Production", color: "green" },
    { value: "service", label: "Service", color: "purple" },
  ];

  function handleSave() {
    const dateStr = date.toISOString().split("T")[0];
    const startDateTime = new Date(`${dateStr}T${startTime}`);
    const endDateTime = new Date(`${dateStr}T${endTime}`);

    onSave({
      membershipId: member.id,
      date: dateStr,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      shiftType,
      breakDuration,
    });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Quick Create Shift</h3>
              <p className="text-blue-100 text-sm mt-1">
                {member.user.name || member.user.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Date Display */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-semibold text-gray-700">Date</div>
            <div className="text-lg font-bold text-gray-900">
              {date.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
          </div>

          {/* Shift Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Shift Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {shiftTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setShiftType(type.value)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    shiftType === type.value
                      ? `bg-${type.color}-600 text-white shadow-md`
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Break Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Break (minutes)
            </label>
            <input
              type="number"
              value={breakDuration}
              onChange={(e) =>
                setBreakDuration(parseInt(e.target.value) || 0)
              }
              min="0"
              step="15"
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md hover:shadow-lg transition-all"
          >
            Create Shift
          </button>
        </div>
      </div>
    </div>
  );
}
