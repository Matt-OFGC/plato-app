"use client";

import { useState } from "react";
import { format, eachDayOfInterval } from "date-fns";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface RecipeSection {
  id: number;
  title: string;
  description: string | null;
  method: string | null;
  order: number;
}

interface Recipe {
  id: number;
  name: string;
  yieldQuantity: string;
  yieldUnit: string;
  method: string | null;
  imageUrl: string | null;
  category: string | null;
  sections?: RecipeSection[];
}

interface Allocation {
  id: number;
  destination: string;
  quantity: string;
  notes: string | null;
  customer: {
    id: number;
    name: string;
  } | null;
}

interface ProductionItem {
  id: number;
  recipeId: number;
  quantity: string;
  completed: boolean;
  priority: number;
  recipe: Recipe;
  allocations: Allocation[];
  completedBy?: number | null;
  completedAt?: Date | null;
  completedByUser?: {
    id: number;
    name: string | null;
    email: string;
  } | null;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: Date | null;
  assignedTo: number | null;
}

interface ProductionPlan {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  notes: string | null;
  items: ProductionItem[];
  tasks: Task[];
}

interface ProductionPlanViewProps {
  plan: ProductionPlan;
  companyId: number;
}

export function ProductionPlanView({ plan, companyId }: ProductionPlanViewProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [expandedRecipes, setExpandedRecipes] = useState<Set<number>>(new Set());
  const [showPrintView, setShowPrintView] = useState(false);

  // Get all days in the production plan
  const days = eachDayOfInterval({
    start: new Date(plan.startDate),
    end: new Date(plan.endDate),
  });

  // Group items by day (for now, show all items every day - can be enhanced with day scheduling later)
  const itemsByDay = days.map(day => ({
    date: day,
    items: plan.items,
  }));

  const toggleRecipeExpand = (recipeId: number) => {
    const newExpanded = new Set(expandedRecipes);
    if (newExpanded.has(recipeId)) {
      newExpanded.delete(recipeId);
    } else {
      newExpanded.add(recipeId);
    }
    setExpandedRecipes(newExpanded);
  };

  const completedCount = plan.items.filter(i => i.completed).length;
  const totalCount = plan.items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/production"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
                <p className="text-sm text-gray-600">
                  {format(new Date(plan.startDate), "MMM d")} - {format(new Date(plan.endDate), "MMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Progress */}
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {completedCount}/{totalCount}
                  </span>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>

              <Link
                href={`/dashboard/production/edit/${plan.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Plan
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 border-b">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              📋 Overview
            </button>
            {days.map((day, index) => (
              <button
                key={day.toISOString()}
                onClick={() => setActiveTab(`day-${index}`)}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === `day-${index}`
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                {format(day, "EEE d")}
              </button>
            ))}
            {plan.tasks.length > 0 && (
              <button
                onClick={() => setActiveTab("tasks")}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === "tasks"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                ✓ Tasks ({plan.tasks.filter(t => !t.completed).length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Total Items</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{plan.items.length}</p>
                  <p className="text-sm text-gray-600 mt-1">recipes to produce</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Completed</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{completedCount}</p>
                  <p className="text-sm text-gray-600 mt-1">{progressPercent.toFixed(0)}% done</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Customers</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">
                    {new Set(plan.items.flatMap(i => i.allocations.map(a => a.customer?.id))).size}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">wholesale orders</p>
                </div>
              </div>

              {/* Notes */}
              {plan.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-1">Plan Notes</h4>
                      <p className="text-sm text-amber-800">{plan.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* All Items */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold text-gray-900">Production Items</h2>
                  <p className="text-sm text-gray-600 mt-1">Complete list of recipes to produce</p>
                </div>
                <div className="divide-y">
                  {plan.items.map((item) => (
                    <ProductionItemCard
                      key={item.id}
                      item={item}
                      expanded={expandedRecipes.has(item.recipeId)}
                      onToggleExpand={() => toggleRecipeExpand(item.recipeId)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "tasks" && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200"
            >
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Tasks</h2>
                <p className="text-sm text-gray-600 mt-1">Additional tasks for this production plan</p>
              </div>
              <div className="divide-y">
                {plan.tasks.length === 0 ? (
                  <div className="p-12 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <p className="text-gray-600">No tasks assigned yet</p>
                  </div>
                ) : (
                  plan.tasks.map((task) => (
                    <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          readOnly
                          className="w-5 h-5 mt-1 text-green-600 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {task.dueDate && (
                              <span>📅 {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {days.map((day, dayIndex) => (
            activeTab === `day-${dayIndex}` && (
              <motion.div
                key={`day-${dayIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Day Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-8 text-white">
                  <h2 className="text-3xl font-bold mb-2">{format(day, "EEEE, MMMM d, yyyy")}</h2>
                  <p className="text-blue-100">Day {dayIndex + 1} of {days.length} • {plan.items.length} items to produce</p>
                </div>

                {/* Day Items */}
                <div className="space-y-4">
                  {plan.items.map((item, itemIndex) => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-lg font-bold text-sm">
                                {itemIndex + 1}
                              </span>
                              <h3 className="text-2xl font-bold text-gray-900">{item.recipe.name}</h3>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <span className="font-semibold text-lg text-blue-600">
                                {parseFloat(item.quantity).toFixed(1)} batches
                              </span>
                              <span className="text-gray-600">
                                = {(parseFloat(item.quantity) * parseFloat(item.recipe.yieldQuantity)).toFixed(1)} {item.recipe.yieldUnit}
                              </span>
                              {item.recipe.category && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {item.recipe.category}
                                </span>
                              )}
                            </div>
                          </div>

                          <Link
                            href={`/dashboard/recipes/${item.recipeId}`}
                            target="_blank"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open Recipe
                          </Link>
                        </div>
                      </div>

                      <div className="p-6 space-y-6">
                        {/* Customer Allocations */}
                        {item.allocations.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Customer Splits
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {item.allocations.map((alloc, idx) => (
                                <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <p className="font-semibold text-blue-900">
                                      {alloc.customer?.name || alloc.destination}
                                    </p>
                                  </div>
                                  <p className="text-2xl font-bold text-blue-600">
                                    {parseFloat(alloc.quantity).toFixed(1)} {item.recipe.yieldUnit}
                                  </p>
                                  {alloc.notes && (
                                    <p className="text-xs text-blue-700 mt-2">{alloc.notes}</p>
                                  )}
                                </div>
                              ))}
                              {(() => {
                                const totalAllocated = item.allocations.reduce((sum, a) => sum + parseFloat(a.quantity), 0);
                                const totalYield = parseFloat(item.quantity) * parseFloat(item.recipe.yieldQuantity);
                                const extra = totalYield - totalAllocated;
                                if (extra > 0.1) {
                                  return (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                      <div className="flex items-start justify-between mb-2">
                                        <p className="font-semibold text-green-900">Internal / Extra</p>
                                      </div>
                                      <p className="text-2xl font-bold text-green-600">
                                        {extra.toFixed(1)} {item.recipe.yieldUnit}
                                      </p>
                                      <p className="text-xs text-green-700 mt-2">For stock or contingency</p>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Recipe Sections (if available) */}
                        {item.recipe.sections && item.recipe.sections.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                              Recipe Sections
                            </h4>
                            <div className="space-y-3">
                              {item.recipe.sections.map((section, sectionIdx) => (
                                <div key={section.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded font-bold text-xs flex-shrink-0">
                                      {sectionIdx + 1}
                                    </span>
                                    <div className="flex-1">
                                      <h5 className="font-semibold text-purple-900">{section.title}</h5>
                                      {section.description && (
                                        <p className="text-sm text-purple-700 mt-1">{section.description}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quick Method Preview */}
                        {item.recipe.method && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Method Preview
                            </h4>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 max-h-40 overflow-y-auto">
                              {item.recipe.method.split('\n').slice(0, 3).map((line, idx) => (
                                <p key={idx} className="mb-1">{line}</p>
                              ))}
                              {item.recipe.method.split('\n').length > 3 && (
                                <p className="text-gray-500 italic">... see full recipe for more</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function ProductionItemCard({ 
  item, 
  expanded, 
  onToggleExpand 
}: { 
  item: ProductionItem; 
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const totalYield = parseFloat(item.quantity) * parseFloat(item.recipe.yieldQuantity);
  const totalAllocated = item.allocations.reduce((sum, a) => sum + parseFloat(a.quantity), 0);
  const extra = totalYield - totalAllocated;

  return (
    <div className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Larger checkbox button for mobile - 40px touch target */}
        <div
          className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all ${
            item.completed 
              ? 'bg-green-600 border-green-600' 
              : 'bg-white border-gray-300'
          }`}
          aria-label={item.completed ? "Completed" : "Not completed"}
        >
          {item.completed && (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <h3 className={`text-base sm:text-lg font-semibold ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {item.recipe.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">{parseFloat(item.quantity).toFixed(1)} batches</span>
                    <span>→</span>
                    <span>{totalYield.toFixed(1)} {item.recipe.yieldUnit}</span>
                    {item.recipe.category && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="text-gray-500">{item.recipe.category}</span>
                      </>
                    )}
                  </div>
                  {/* Show who completed it */}
                  {item.completed && item.completedByUser && (
                    <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">
                        Completed by {item.completedByUser.name || item.completedByUser.email}
                      </span>
                      {item.completedAt && (
                        <span className="text-green-600">
                          • {format(new Date(item.completedAt), "MMM d, h:mm a")}
                        </span>
                      )}
                    </p>
                  )}
                </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/dashboard/recipes/${item.recipeId}`}
                target="_blank"
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Recipe
              </Link>
              {(item.allocations.length > 0 || item.recipe.sections) && (
                <button
                  onClick={onToggleExpand}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg 
                    className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 space-y-4 overflow-hidden"
              >
                {/* Allocations */}
                {item.allocations.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">Customer Splits:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.allocations.map((alloc, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-sm font-medium"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {alloc.customer?.name || alloc.destination}: {parseFloat(alloc.quantity).toFixed(1)} {item.recipe.yieldUnit}
                        </span>
                      ))}
                      {extra > 0.1 && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 border border-green-200 text-green-900 rounded-lg text-sm font-medium">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Internal: {extra.toFixed(1)} {item.recipe.yieldUnit}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Recipe Sections */}
                {item.recipe.sections && item.recipe.sections.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">Recipe Sections:</p>
                    <div className="space-y-2">
                      {item.recipe.sections.map((section, idx) => (
                        <div key={section.id} className="flex items-start gap-2 text-sm">
                          <span className="flex items-center justify-center w-5 h-5 bg-purple-600 text-white rounded text-xs font-bold flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">{section.title}</p>
                            {section.description && (
                              <p className="text-gray-600 text-xs mt-0.5">{section.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

