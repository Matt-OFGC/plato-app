"use client";

import { RecipeStep } from "@/lib/mocks/recipe";
import { useState } from "react";
import TimerButton from "./TimerButton";

interface InstructionsPanelProps {
  steps: RecipeStep[];
  viewMode: "whole" | "steps" | "edit";
  activeStepIndex: number;
  recipeId: string;
  onStepsChange: (steps: RecipeStep[]) => void;
  onActiveStepChange: (index: number) => void;
}

export default function InstructionsPanel({
  steps,
  viewMode,
  activeStepIndex,
  recipeId,
  onStepsChange,
  onActiveStepChange,
}: InstructionsPanelProps) {
  const [editedInstructions, setEditedInstructions] = useState<
    Record<string, string[]>
  >({});

  // Filter steps based on view mode
  const displayedSteps =
    (viewMode === "steps" || viewMode === "edit") && steps.length > 0
      ? [steps[activeStepIndex]]
      : steps;

  const handleInstructionsEdit = (stepId: string, value: string) => {
    const lines = value.split("\n").map((line) => line.trim()).filter(Boolean);
    setEditedInstructions((prev) => ({
      ...prev,
      [stepId]: lines,
    }));
  };

  const handleAddStep = () => {
    const newStep: RecipeStep = {
      id: `step-${Date.now()}`,
      title: `Step ${steps.length + 1}`,
      instructions: ["Enter instructions here..."],
    };
    onStepsChange([...steps, newStep]);
  };

  const handleDeleteStep = (stepId: string) => {
    const newSteps = steps.filter((s) => s.id !== stepId);
    if (newSteps.length === 0) return; // Don't allow deleting all steps
    
    onStepsChange(newSteps);
    
    // Adjust active step if needed
    if (activeStepIndex >= newSteps.length) {
      onActiveStepChange(Math.max(0, newSteps.length - 1));
    }
  };

  const handleUpdateStepTitle = (stepId: string, newTitle: string) => {
    const newSteps = steps.map((s) =>
      s.id === stepId ? { ...s, title: newTitle } : s
    );
    onStepsChange(newSteps);
  };

  const handleUpdateStepTemp = (stepId: string, temp: number | undefined) => {
    const newSteps = steps.map((s) =>
      s.id === stepId ? { ...s, temperatureC: temp } : s
    );
    onStepsChange(newSteps);
  };

  const handleUpdateStepDuration = (stepId: string, duration: number | undefined) => {
    const newSteps = steps.map((s) =>
      s.id === stepId ? { ...s, durationMin: duration } : s
    );
    onStepsChange(newSteps);
  };

  const handleToggleTimer = (stepId: string) => {
    const newSteps = steps.map((s) =>
      s.id === stepId ? { ...s, hasTimer: !s.hasTimer } : s
    );
    onStepsChange(newSteps);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-fit max-h-[800px] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 z-10">
        <div className="w-1 h-6 bg-blue-600 rounded-sm" />
        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">Instructions</h2>
        
        {/* Add Step Button - Show in Edit mode */}
        {viewMode === "edit" && (
          <button
            onClick={handleAddStep}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Step
          </button>
        )}
      </div>

      {/* Instructions List */}
      <div className="overflow-y-auto flex-1">
        {displayedSteps.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>No instructions available</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayedSteps.map((step, stepIndex) => {
              const actualIndex = steps.findIndex(s => s.id === step.id);
              return (
              <div key={step.id} className="p-5 border-b border-gray-100 last:border-b-0">
                {/* Step Number Badge */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {actualIndex + 1}
                  </div>
                  
                  <div className="flex-1">
                {/* Step Header with Metadata */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {viewMode === "edit" ? (
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleUpdateStepTitle(step.id, e.target.value)}
                        className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Step title..."
                      />
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                        {step.title}
                      </span>
                    )}

                    {/* Delete Button - Show in Edit mode */}
                    {viewMode === "edit" && steps.length > 1 && (
                      <button
                        onClick={() => handleDeleteStep(step.id)}
                        className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        title="Delete step"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Editable Step Controls (Edit mode) */}
                  {viewMode === "edit" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Temperature */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200">
                        <svg className="w-3 h-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                        </svg>
                        <input
                          type="number"
                          value={step.temperatureC || ""}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                            handleUpdateStepTemp(step.id, val);
                          }}
                          placeholder="--"
                          className="w-12 bg-transparent border-0 text-xs font-medium text-orange-700 placeholder-orange-400 focus:ring-0 focus:outline-none p-0"
                        />
                        <span className="text-xs font-medium text-orange-700">°C</span>
                      </div>

                      {/* Duration */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <input
                          type="number"
                          value={step.durationMin || ""}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                            handleUpdateStepDuration(step.id, val);
                          }}
                          placeholder="--"
                          className="w-12 bg-transparent border-0 text-xs font-medium text-blue-700 placeholder-blue-400 focus:ring-0 focus:outline-none p-0"
                        />
                        <span className="text-xs font-medium text-blue-700">m</span>
                      </div>

                      {/* Timer Toggle */}
                      {step.durationMin && (
                        <button
                          onClick={() => handleToggleTimer(step.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            step.hasTimer
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          Timer
                        </button>
                      )}
                    </div>
                  )}

                  {/* Read-only metadata display (non-edit modes) */}
                  {viewMode !== "edit" && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {typeof step.temperatureC === "number" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                          </svg>
                          {step.temperatureC}°C
                        </span>
                      )}

                      {typeof step.durationMin === "number" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {step.durationMin}m
                        </span>
                      )}

                      {step.hasTimer && step.durationMin && (
                        <TimerButton
                          recipeId={recipeId}
                          stepId={step.id}
                          minutes={step.durationMin}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Instructions - Editable in Edit mode */}
                {viewMode === "edit" ? (
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={Math.max(
                      4,
                      (editedInstructions[step.id] || step.instructions).length + 1
                    )}
                    value={
                      editedInstructions[step.id]?.join("\n") ||
                      step.instructions.map((line, i) => `${i + 1}. ${line}`).join("\n")
                    }
                    onChange={(e) =>
                      handleInstructionsEdit(step.id, e.target.value)
                    }
                    placeholder="Enter instructions, one per line..."
                  />
                ) : (
                  <ol className="list-decimal list-inside space-y-3 text-gray-700 leading-relaxed">
                    {step.instructions.map((instruction, i) => (
                      <li key={i} className="text-base">
                        {instruction}
                      </li>
                    ))}
                  </ol>
                )}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

