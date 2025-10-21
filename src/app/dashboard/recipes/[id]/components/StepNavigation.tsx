"use client";

import { RecipeStep } from "@/app/lib/mocks/recipe";

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
    <div className="flex items-center gap-2 flex-wrap">
      {steps.map((step, index) => {
        const isActive = index === activeStepIndex;
        
        return (
          <button
            key={step.id}
            onClick={() => onStepChange(index)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
              isActive
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                isActive
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {index + 1}
            </span>
            <span className="text-sm font-medium">{step.title}</span>
          </button>
        );
      })}
      
      <div className="ml-auto text-sm text-gray-500 font-medium">
        Step {activeStepIndex + 1} of {totalSteps}
      </div>
    </div>
  );
}

