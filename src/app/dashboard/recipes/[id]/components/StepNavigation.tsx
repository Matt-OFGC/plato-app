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
    <div className="flex items-center gap-2 flex-wrap">
      {steps.map((step, index) => {
        const isActive = index === activeStepIndex;
        
        return (
          <button
            key={step.id}
            onClick={() => onStepChange(index)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
              isActive
                ? "bg-green-500 border-green-500 text-white shadow-lg hover:bg-green-600 hover:shadow-xl"
                : "bg-white/80 backdrop-blur-xl border-gray-200/50 text-gray-700 hover:bg-white hover:shadow-md"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                isActive
                  ? "bg-white/20 text-white"
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

