"use client";

import { useState } from "react";
import Link from "next/link";

interface ProductionItem {
  id: number;
  quantity: number;
  completed: boolean;
  notes: string | null;
  recipe: {
    id: number;
    name: string;
    yieldQuantity: string;
    yieldUnit: string;
  };
}

interface ProductionPlan {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  items: ProductionItem[];
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  priority: number;
  assignedToName: string | null;
  planName: string;
}

interface StaleIngredient {
  id: number;
  name: string;
  daysSinceUpdate: number;
}

interface OperationalDashboardProps {
  todayProduction: ProductionPlan[];
  weekProduction: ProductionPlan[];
  tasks: Task[];
  staleIngredients: StaleIngredient[];
  userName?: string;
}

export function OperationalDashboard({
  todayProduction,
  weekProduction,
  tasks,
  staleIngredients,
  userName,
}: OperationalDashboardProps) {
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  // Calculate stats
  const todayItems = todayProduction.flatMap(plan => plan.items);
  const todayCompleted = todayItems.filter(item => item.completed).length;
  const todayTotal = todayItems.length;
  const todayProgress = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  const pendingTasks = tasks.filter(t => !t.completed);
  const urgentTasks = pendingTasks.filter(t => {
    if (!t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1; // Due today or overdue
  });

  const displayTasks = showCompletedTasks ? tasks : pendingTasks;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome back{userName ? `, ${userName}` : ""}! 👋
        </h1>
        <p className="text-lg text-gray-600">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Today's Progress</p>
              <p className="text-3xl font-bold">{todayProgress}%</p>
              <p className="text-blue-100 text-xs mt-1">{todayCompleted} of {todayTotal} items</p>
            </div>
            <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium mb-1">Pending Tasks</p>
              <p className="text-3xl font-bold">{pendingTasks.length}</p>
              {urgentTasks.length > 0 && (
                <p className="text-amber-100 text-xs mt-1 font-semibold">⚠️ {urgentTasks.length} urgent</p>
              )}
            </div>
            <svg className="w-12 h-12 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">This Week</p>
              <p className="text-3xl font-bold">{weekProduction.length}</p>
              <p className="text-purple-100 text-xs mt-1">production plans</p>
            </div>
            <svg className="w-12 h-12 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${staleIngredients.length > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600'} rounded-xl p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${staleIngredients.length > 0 ? 'text-red-100' : 'text-green-100'} text-sm font-medium mb-1`}>Price Alerts</p>
              <p className="text-3xl font-bold">{staleIngredients.length}</p>
              <p className={`${staleIngredients.length > 0 ? 'text-red-100' : 'text-green-100'} text-xs mt-1`}>
                {staleIngredients.length > 0 ? 'need updating' : 'all current'}
              </p>
            </div>
            <svg className={`w-12 h-12 ${staleIngredients.length > 0 ? 'text-red-200' : 'text-green-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Production */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Today's Production</h2>
                  <p className="text-sm text-gray-600 mt-1">What needs to be made today</p>
                </div>
                <Link
                  href="/dashboard/production"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View All →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {todayProduction.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500 mb-4">No production scheduled for today</p>
                  <Link
                    href="/dashboard/production"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Production Plan
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {todayProduction.map(plan => (
                    <div key={plan.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                      <h3 className="font-semibold text-gray-900 mb-3">{plan.name}</h3>
                      <div className="space-y-2">
                        {plan.items.map(item => (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              item.completed
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={item.completed}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                readOnly
                              />
                              <div>
                                <p className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  {item.recipe.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {item.quantity} batch{item.quantity !== 1 ? 'es' : ''} × {item.recipe.yieldQuantity}{item.recipe.yieldUnit}
                                </p>
                              </div>
                            </div>
                            {!item.completed && (
                              <Link
                                href={`/dashboard/recipes/${item.recipe.id}`}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                View Recipe →
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* This Week's Schedule */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">This Week's Schedule</h2>
              <p className="text-sm text-gray-600 mt-1">Upcoming production plans</p>
            </div>
            <div className="p-6">
              {weekProduction.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No production plans scheduled this week</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {weekProduction.slice(0, 5).map(plan => (
                    <div key={plan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div>
                        <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(plan.startDate).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {' - '}
                          {new Date(plan.endDate).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {plan.items.length} recipe{plan.items.length !== 1 ? 's' : ''} planned
                        </p>
                      </div>
                      <Link
                        href="/dashboard/production"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Tasks */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-900">Tasks</h2>
                <button
                  onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  {showCompletedTasks ? 'Hide' : 'Show'} completed
                </button>
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {displayTasks.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 text-sm">All tasks completed! 🎉</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayTasks.map(task => {
                    const isUrgent = task.dueDate && urgentTasks.some(t => t.id === task.id);
                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border ${
                          task.completed
                            ? 'bg-gray-50 border-gray-200'
                            : isUrgent
                            ? 'bg-red-50 border-red-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            className="mt-1 w-4 h-4 rounded border-gray-300"
                            readOnly
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              {task.dueDate && (
                                <span className={isUrgent && !task.completed ? 'text-red-600 font-semibold' : ''}>
                                  📅 {new Date(task.dueDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              {task.assignedToName && (
                                <span>👤 {task.assignedToName}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          {staleIngredients.length > 0 && (
            <div className="bg-white rounded-xl border border-red-200 shadow-sm">
              <div className="p-6 border-b border-red-200 bg-red-50">
                <h2 className="text-lg font-bold text-red-900">⚠️ Price Alerts</h2>
                <p className="text-sm text-red-700 mt-1">These ingredients need price updates</p>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {staleIngredients.slice(0, 10).map(ingredient => (
                    <Link
                      key={ingredient.id}
                      href={`/dashboard/ingredients/${ingredient.id}`}
                      className="block p-3 bg-red-50 border border-red-200 rounded-lg hover:border-red-300 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{ingredient.name}</p>
                      <p className="text-xs text-red-600 mt-1">
                        {ingredient.daysSinceUpdate} days since last update
                      </p>
                    </Link>
                  ))}
                </div>
                {staleIngredients.length > 10 && (
                  <Link
                    href="/dashboard/ingredients"
                    className="block text-center text-sm text-red-600 hover:text-red-700 font-medium mt-3"
                  >
                    View all {staleIngredients.length} ingredients →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/production"
                className="block w-full py-2 px-4 bg-white/20 hover:bg-white/30 rounded-lg text-center font-medium transition-colors"
              >
                Plan Production
              </Link>
              <Link
                href="/dashboard/recipes/new"
                className="block w-full py-2 px-4 bg-white/20 hover:bg-white/30 rounded-lg text-center font-medium transition-colors"
              >
                New Recipe
              </Link>
              <Link
                href="/dashboard/ingredients/new"
                className="block w-full py-2 px-4 bg-white/20 hover:bg-white/30 rounded-lg text-center font-medium transition-colors"
              >
                Add Ingredient
              </Link>
              <Link
                href="/dashboard/analytics"
                className="block w-full py-2 px-4 bg-white/20 hover:bg-white/30 rounded-lg text-center font-medium transition-colors"
              >
                View Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

