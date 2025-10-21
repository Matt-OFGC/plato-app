"use client";

import { useCountdown } from "@/app/lib/useCountdown";

interface TimerButtonProps {
  recipeId: string;
  stepId: string;
  minutes: number;
}

export default function TimerButton({
  recipeId,
  stepId,
  minutes,
}: TimerButtonProps) {
  const timer = useCountdown(recipeId, stepId, minutes);

  const displayTime = timer.running
    ? `${timer.minutes}:${String(timer.seconds).padStart(2, "0")}`
    : "Timer";

  const handleClick = () => {
    if (timer.running) {
      timer.pause();
    } else {
      timer.start(minutes);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
        timer.running
          ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
      }`}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        {timer.running ? (
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        ) : (
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        )}
      </svg>
      {displayTime}
    </button>
  );
}

