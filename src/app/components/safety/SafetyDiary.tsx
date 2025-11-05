"use client";

import { useState, useEffect } from "react";
import { CalendarView } from "./CalendarView";

interface SafetyDiaryProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function SafetyDiary({ selectedDate, onDateChange }: SafetyDiaryProps) {
  const [diaryData, setDiaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<Record<string, any>>({});
  const [showCalendar, setShowCalendar] = useState(true);

  useEffect(() => {
    loadDiaryData();
    loadMonthActivity();
  }, [selectedDate]);

  async function loadDiaryData() {
    setLoading(true);
    try {
      const response = await fetch(`/api/safety/diary/${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setDiaryData(data);
      }
    } catch (error) {
      console.error("Failed to load diary:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMonthActivity() {
    try {
      const date = new Date(selectedDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const response = await fetch(`/api/safety/diary/month/${year}/${month}`);
      if (response.ok) {
        const data = await response.json();
        setActivityData(data);
      }
    } catch (error) {
      console.error("Failed to load activity:", error);
    }
  }

  const date = new Date(selectedDate);
  const formattedDate = date.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar View Toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Safety Diary</h1>
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
        >
          {showCalendar ? "Hide Calendar" : "Show Calendar"}
        </button>
      </div>

      {/* Calendar */}
      {showCalendar && (
        <CalendarView
          selectedDate={selectedDate}
          onDateSelect={onDateChange}
          activityData={activityData}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{formattedDate}</h1>
          {diaryData?.stats && (
            <p className="text-gray-600 mt-1">
              {diaryData.stats.totalTasks} tasks • {diaryData.stats.completedCount} completed •{" "}
              {diaryData.stats.flaggedCount} flagged
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {diaryData?.stats && (
            <div className="bg-green-50 rounded-2xl px-4 py-2 border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {diaryData.stats.complianceScore}%
              </div>
              <div className="text-xs text-green-600">Compliance</div>
            </div>
          )}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Completed Tasks */}
      {diaryData?.completed && diaryData.completed.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-green-500">✓</span> Completed Tasks
          </h2>
          <div className="space-y-3">
            {diaryData.completed.map((completion: any) => (
              <div
                key={completion.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{completion.templateEmoji}</span>
                      <h3 className="font-semibold text-gray-900">{completion.taskName}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                          completion.status === "flagged"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {completion.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Completed by {completion.completedByName} ({completion.completedByRole}) at{" "}
                      {new Date(completion.completedAt).toLocaleTimeString()}
                    </p>
                    {completion.notes && (
                      <p className="text-sm text-gray-700 mt-2 italic">"{completion.notes}"</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending Tasks */}
      {diaryData?.pending && diaryData.pending.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-gray-400">⏰</span> Pending Tasks
          </h2>
          <div className="space-y-3">
            {diaryData.pending.map((task: any) => (
              <div
                key={task.id}
                className="bg-gray-50 rounded-2xl border border-gray-200 p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{task.templateEmoji}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{task.templateName}</h3>
                    <p className="text-sm text-gray-600">
                      Due: {task.dueTime || "All day"}
                      {task.assignedToName && ` • Assigned to ${task.assignedToName}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {(!diaryData || (diaryData.completed.length === 0 && diaryData.pending.length === 0)) && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No activity on this date</h3>
          <p className="text-gray-600">Tasks completed on this day will appear here.</p>
        </div>
      )}
    </div>
  );
}

