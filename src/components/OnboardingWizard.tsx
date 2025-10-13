"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingWizardProps {
  userName?: string;
  companyName: string;
}

export function OnboardingWizard({ userName, companyName }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const router = useRouter();

  const steps = [
    {
      title: `Welcome to Plato, ${userName || "there"}! 👋`,
      description: "Let's get you set up with a quick tour",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Plato helps you manage recipes, calculate costs, and run your kitchen efficiently.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Recipe Management</h4>
                <p className="text-sm text-gray-600">Create and cost your recipes accurately</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Ingredient Tracking</h4>
                <p className="text-sm text-gray-600">Keep track of costs and suppliers</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Team Collaboration</h4>
                <p className="text-sm text-gray-600">Work together with your team</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Create Your First Ingredient 🥕",
      description: "Start by adding some ingredients to your inventory",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Ingredients are the building blocks of your recipes. Add items with their costs to track profitability.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Pro Tip:</h4>
            <p className="text-sm text-gray-600">
              Include the pack size and price from your supplier to get accurate per-unit costs.
            </p>
          </div>
          <button
            onClick={() => {
              router.push("/dashboard/ingredients/new");
            }}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Add Your First Ingredient
          </button>
        </div>
      ),
    },
    {
      title: "Create Your First Recipe 📝",
      description: "Build a recipe and calculate its cost",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Recipes combine your ingredients to calculate total cost and food cost percentage.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">What you'll add:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Recipe name and yield</li>
              <li>• Ingredients with quantities</li>
              <li>• Method and instructions</li>
              <li>• Selling price (optional)</li>
            </ul>
          </div>
          <button
            onClick={() => {
              router.push("/dashboard/recipes/new");
            }}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Create Your First Recipe
          </button>
        </div>
      ),
    },
    {
      title: "Invite Your Team 👥",
      description: "Collaborate with your kitchen staff",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Add team members to collaborate on recipes and manage your kitchen together.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Owner</span>
              <span className="text-xs text-gray-500">Full access + billing</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Admin</span>
              <span className="text-xs text-gray-500">Full access to content</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Editor</span>
              <span className="text-xs text-gray-500">Can create & edit</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-900">Viewer</span>
              <span className="text-xs text-gray-500">Read-only access</span>
            </div>
          </div>
          <button
            onClick={() => {
              router.push("/dashboard/team");
            }}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Manage Team
          </button>
        </div>
      ),
    },
    {
      title: "You're All Set! 🎉",
      description: "Start using Plato to its full potential",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            You're ready to go! Here are some keyboard shortcuts to help you work faster:
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-900">Quick search</span>
              <kbd className="px-2 py-1 text-xs bg-white border border-gray-300 rounded">⌘K</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-900">New recipe</span>
              <kbd className="px-2 py-1 text-xs bg-white border border-gray-300 rounded">N</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-900">New ingredient</span>
              <kbd className="px-2 py-1 text-xs bg-white border border-gray-300 rounded">I</kbd>
            </div>
          </div>
          <button
            onClick={handleComplete}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Get Started!
          </button>
        </div>
      ),
    },
  ];

  async function handleComplete() {
    try {
      const res = await fetch("/api/user/complete-onboarding", { 
        method: "POST",
        credentials: "include",
      });
      
      if (res.ok) {
        console.log("✅ Onboarding completed successfully");
        // Force a hard refresh to get updated user data
        window.location.href = "/dashboard";
      } else {
        console.error("Failed to complete onboarding");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleSkip() {
    setSkipped(true);
    await handleComplete();
  }

  if (skipped) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200">
          <div
            className="h-full bg-green-600 transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {steps[step].title}
              </h2>
              <p className="text-gray-600 mb-6">{steps[step].description}</p>
              {steps[step].content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="border-t p-6 bg-gray-50 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            {step < steps.length - 1 && (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

