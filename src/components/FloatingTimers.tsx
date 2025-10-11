"use client";

import { useTimers } from "@/contexts/TimerContext";
import Link from "next/link";

export function FloatingTimers() {
  const { timers, stopTimer } = useTimers();
  const activeTimers = Object.values(timers);

  if (activeTimers.length === 0) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2">
      {activeTimers.map((timer) => (
        <div
          key={timer.id}
          className="bg-white rounded-xl border-2 border-amber-400 shadow-2xl p-4 min-w-[280px] animate-in slide-in-from-bottom"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <Link
                href={`/dashboard/recipes/${timer.recipeId}`}
                className="text-sm font-semibold text-gray-900 hover:text-emerald-600 transition-colors"
              >
                {timer.recipeName}
              </Link>
              <p className="text-xs text-gray-600 mt-0.5">{timer.stepTitle}</p>
            </div>
            <button
              onClick={() => stopTimer(timer.id)}
              className="text-gray-400 hover:text-red-600 transition-colors"
              title="Stop timer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-2xl font-bold font-mono text-amber-700">
                {formatTime(timer.remaining)}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {timer.totalMinutes} min total
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-1000"
              style={{ width: `${(timer.remaining / (timer.totalMinutes * 60)) * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}

