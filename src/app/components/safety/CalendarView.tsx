"use client";

import { useState } from "react";

interface CalendarViewProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  activityData?: Record<string, { completed: number; flagged: number; pending: number }>;
}

export function CalendarView({ selectedDate, onDateSelect, activityData = {} }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Get first day of month and how many days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Get previous/next month
  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today.toISOString().split("T")[0]);
  };

  // Format date as YYYY-MM-DD
  const formatDate = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // Check if date is selected
  const isSelected = (day: number) => {
    const dateStr = formatDate(day);
    return dateStr === selectedDate;
  };

  // Get activity dots for a date
  const getActivityDots = (day: number) => {
    const dateStr = formatDate(day);
    const activity = activityData[dateStr];
    if (!activity) return null;

    const dots = [];
    if (activity.completed > 0) {
      dots.push(<div key="completed" className="w-1.5 h-1.5 rounded-full bg-green-500" />);
    }
    if (activity.flagged > 0) {
      dots.push(<div key="flagged" className="w-1.5 h-1.5 rounded-full bg-yellow-500" />);
    }
    if (activity.pending > 0 && activity.completed === 0) {
      dots.push(<div key="pending" className="w-1.5 h-1.5 rounded-full bg-gray-400" />);
    }
    return dots.length > 0 ? <div className="flex gap-1 justify-center mt-1">{dots}</div> : null;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Create array of days (with empty cells for days before month starts)
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {monthNames[month]} {year}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = formatDate(day);
          const today = isToday(day);
          const selected = isSelected(day);

          return (
            <button
              key={day}
              onClick={() => onDateSelect(dateStr)}
              className={`aspect-square p-2 rounded-xl transition-all relative ${
                selected
                  ? "bg-orange-500 text-white font-semibold"
                  : today
                  ? "bg-orange-50 text-orange-700 font-semibold border-2 border-orange-300"
                  : "hover:bg-gray-50 text-gray-900"
              }`}
            >
              <div className="text-sm">{day}</div>
              {getActivityDots(day)}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          <span>Flagged</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
}

