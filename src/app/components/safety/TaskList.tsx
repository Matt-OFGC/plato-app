"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface TaskListProps {
  selectedDate: string;
}

export function TaskList({ selectedDate }: TaskListProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [selectedDate]);

  async function loadTasks() {
    setLoading(true);
    try {
      const response = await fetch(`/api/safety/tasks?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  // Group tasks by time window
  const groupedTasks = tasks.reduce((acc: any, task: any) => {
    const window = task.timeWindow || "other";
    if (!acc[window]) acc[window] = [];
    acc[window].push(task);
    return acc;
  }, {});

  const timeWindowLabels: Record<string, string> = {
    before_open: "Before Open",
    open: "Opening",
    lunch: "Lunch",
    afternoon: "Afternoon",
    close: "Closing",
    other: "Other",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => window.location.href = `/dashboard/safety?date=${e.target.value}`}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {Object.keys(groupedTasks).length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✓</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks scheduled</h3>
          <p className="text-gray-600">Create a template to schedule tasks.</p>
        </div>
      ) : (
        Object.entries(groupedTasks).map(([window, windowTasks]: [string, any[]]) => (
          <section key={window}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {timeWindowLabels[window] || window}
            </h2>
            <div className="space-y-3">
              {windowTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/dashboard/safety/tasks/${task.id}`}
                  className="block bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{task.templateEmoji}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{task.templateName}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {task.dueTime && `Due: ${task.dueTime} • `}
                        {task.enforceTimeWindow && task.timeWindowStart && task.timeWindowEnd && (
                          <span className="text-orange-600 font-medium">
                            Time window: {task.timeWindowStart.slice(0, 5)} - {task.timeWindowEnd.slice(0, 5)} • 
                          </span>
                        )}
                        Category: {task.templateCategory}
                        {task.assignedToName && ` • Assigned to ${task.assignedToName}`}
                      </p>
                      {task.enforceTimeWindow && task.timeWindowStart && task.timeWindowEnd && (() => {
                        const now = new Date();
                        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                        const startTime = task.timeWindowStart.slice(0, 5);
                        const endTime = task.timeWindowEnd.slice(0, 5);
                        const isInWindow = currentTime >= startTime && currentTime <= endTime;
                        return (
                          <p className={`text-xs mt-1 ${isInWindow ? 'text-green-600' : 'text-red-600'}`}>
                            {isInWindow ? '✓ Within time window' : `⚠ Only completable between ${startTime} - ${endTime}`}
                          </p>
                        );
                      })()}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        task.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : task.status === "in_progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

