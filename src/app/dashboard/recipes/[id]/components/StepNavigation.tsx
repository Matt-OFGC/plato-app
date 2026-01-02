"use client";

import { RecipeStep } from "@/lib/mocks/recipe";

interface StepNavigationProps {
  steps: RecipeStep[];
  activeStepIndex: number;
  onStepChange: (index: number) => void;
  totalSteps: number;
}

export default function StepNavigation({
  steps,
  activeStepIndex,
  onStepChange,
  totalSteps,
}: StepNavigationProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {steps.map((step, index) => {
        const isActive = index === activeStepIndex;
        
        return (
          <button
            key={step.id}
            onClick={() => onStepChange(index)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all backdrop-blur-md ${
              isActive
                ? "bg-green-500/90 border-green-400 text-white shadow-lg shadow-green-200/70 hover:bg-green-600"
                : "bg-white/60 border-white/60 text-gray-700 shadow-sm hover:bg-white/80"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold ${
                isActive
                  ? "bg-white/30 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {index + 1}
            </span>
            <span className="text-sm font-semibold">{step.title}</span>
          </button>
        );
      })}
      
      <div className="ml-auto text-sm text-gray-500 font-medium">
        Step {activeStepIndex + 1} of {totalSteps}
      </div>
    </div>
  );
}

