"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  href?: string;
  action?: () => void;
}

interface Props {
  companyId: number;
}

export function CompanyOnboardingChecklist({ companyId }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChecklistStatus();
  }, [companyId]);

  const fetchChecklistStatus = async () => {
    setLoading(true);
    try {
      // Fetch company data to determine completion status
      const res = await fetch(`/api/companies/onboarding-status?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      } else {
        // Fallback: create default checklist
        setItems(getDefaultChecklist());
      }
    } catch (error) {
      console.error("Failed to fetch checklist:", error);
      setItems(getDefaultChecklist());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultChecklist = (): ChecklistItem[] => {
    return [
      {
        id: "profile",
        label: "Complete Company Profile",
        description: "Add your business details, logo, and contact information",
        completed: false,
        href: "/dashboard/business",
      },
      {
        id: "ingredients",
        label: "Add Your First Ingredient",
        description: "Start building your ingredient library",
        completed: false,
        href: "/dashboard/ingredients",
      },
      {
        id: "recipes",
        label: "Create Your First Recipe",
        description: "Add a recipe to get started",
        completed: false,
        href: "/dashboard/recipes",
      },
      {
        id: "team",
        label: "Invite Team Members",
        description: "Add your team to collaborate",
        completed: false,
        href: "/dashboard/team",
      },
      {
        id: "settings",
        label: "Configure Settings",
        description: "Set up preferences and defaults",
        completed: false,
        href: "/dashboard/account/preferences",
      },
    ];
  };

  const handleItemClick = (item: ChecklistItem) => {
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
  };

  const completedCount = items.filter(item => item.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading checklist...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Getting Started</h2>
        <p className="text-gray-600 text-sm mb-4">
          Complete these steps to get the most out of your account
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-sm text-gray-600 mt-2">
          {completedCount} of {items.length} completed
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={`w-full flex items-start gap-3 p-4 rounded-lg border transition-colors text-left ${
              item.completed
                ? "bg-emerald-50 border-emerald-200"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {item.completed ? (
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={`font-medium ${
                  item.completed ? "text-emerald-900" : "text-gray-900"
                }`}
              >
                {item.label}
              </div>
              <div
                className={`text-sm mt-1 ${
                  item.completed ? "text-emerald-700" : "text-gray-600"
                }`}
              >
                {item.description}
              </div>
            </div>
            {!item.completed && (
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
