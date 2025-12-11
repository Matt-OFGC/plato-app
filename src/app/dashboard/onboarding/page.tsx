"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: "company",
      title: "Company Information",
      description: "Tell us about your business (optional - you can skip and complete later)",
      required: false,
      completed: false,
    },
    {
      id: "preferences",
      title: "Preferences",
      description: "Set up your preferences (optional)",
      required: false,
      completed: false,
    },
  ]);
  const [skipped, setSkipped] = useState(false);

  const handleSkip = () => {
    setSkipped(true);
    router.push("/dashboard");
  };

  const handleComplete = async () => {
    // Mark step as completed
    const updatedSteps = [...steps];
    updatedSteps[currentStep].completed = true;
    setSteps(updatedSteps);

    // Move to next step or complete onboarding
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as complete
      try {
        await fetch("/api/user/complete-onboarding", {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to mark onboarding complete:", error);
      }
      router.push("/dashboard");
    }
  };

  if (skipped) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome! Let's get you started
          </h1>
          <p className="text-gray-600">
            This will only take a minute. You can skip any step and complete it later.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    index <= currentStep
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step.completed ? "✓" : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStep ? "bg-emerald-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-500 text-center mt-2">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Current step content */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {steps[currentStep].title}
          </h2>
          <p className="text-gray-600 mb-6">{steps[currentStep].description}</p>

          {steps[currentStep].id === "company" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Your company has been created automatically. You can update your company
                details in{" "}
                <a
                  href="/dashboard/business"
                  className="text-emerald-600 hover:underline"
                >
                  Business Settings
                </a>{" "}
                anytime.
              </p>
            </div>
          )}

          {steps[currentStep].id === "preferences" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                You can configure your preferences in{" "}
                <a
                  href="/dashboard/account"
                  className="text-emerald-600 hover:underline"
                >
                  Account Settings
                </a>{" "}
                anytime.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Skip All
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            {currentStep < steps.length - 1 ? "Next" : "Complete"}
          </button>
        </div>

        {/* Optional indicator */}
        <p className="text-xs text-gray-400 text-center mt-4">
          All steps are optional. You can complete them later in Settings.
        </p>
      </div>
    </div>
  );
}
