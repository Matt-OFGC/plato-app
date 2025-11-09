"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PriceConfirmationModal } from "./PriceConfirmationModal";

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
  packPrice: number;
  currency: string;
}

interface OperationalDashboardProps {
  todayProduction: ProductionPlan[];
  weekProduction: ProductionPlan[];
  tasks: Task[];
  staleIngredients: StaleIngredient[];
  userName?: string;
  userRole?: string;
  companyName?: string;
}

export function OperationalDashboard({
  todayProduction,
  weekProduction,
  tasks,
  staleIngredients,
  userName,
  userRole,
  companyName,
}: OperationalDashboardProps) {
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<StaleIngredient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

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

  const formatRole = (role?: string) => {
    if (!role) return 'Team Member';
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
      {/* Modern Header Card with User Info - Compact */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 rounded-xl shadow-xl overflow-hidden relative">
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg border-2 border-white/30">
                {(userName?.[0] || 'U').toUpperCase()}
              </div>
              <div className="text-white">
                <h1 className="text-xl sm:text-2xl font-bold mb-0.5">
                  Welcome back{userName ? `, ${userName}` : ''}!
                </h1>
                <div className="flex flex-wrap items-center gap-1.5 text-emerald-50 text-sm">
                  <span>{formatRole(userRole)}</span>
                  {companyName && (
                    <>
                      <span className="text-emerald-300">•</span>
                      <span>{companyName}</span>
                    </>
                  )}
                </div>
                <p className="text-emerald-100 text-xs mt-1">
                  {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-medium border border-white/30">
                Personalized
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar - Modern Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Today's Progress</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{todayProgress}%</p>
          <p className="text-xs text-gray-500">{todayCompleted} of {todayTotal} items completed</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Pending Tasks</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{pendingTasks.length}</p>
          {urgentTasks.length > 0 ? (
            <p className="text-xs text-red-600 font-semibold">{urgentTasks.length} urgent task{urgentTasks.length !== 1 ? 's' : ''}</p>
          ) : (
            <p className="text-xs text-gray-500">No urgent tasks</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">This Week</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{weekProduction.length}</p>
          <p className="text-xs text-gray-500">production plan{weekProduction.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl ${staleIngredients.length > 0 ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/30' : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30'} flex items-center justify-center`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Price Alerts</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{staleIngredients.length}</p>
          <p className={`text-xs ${staleIngredients.length > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
            {staleIngredients.length > 0 ? 'need updating' : 'All prices current'}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
        {/* Today's Production */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Today's Production</h2>
                  <p className="text-sm text-gray-600 mt-1">What needs to be made today</p>
                </div>
                <Link
                  href="/dashboard/production"
                  className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  View All →
                </Link>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              {todayProduction.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-6 text-base">No production scheduled for today</p>
                  <Link
                    href="/dashboard/production"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg shadow-emerald-600/30"
                  >
                    Create Production Plan
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {todayProduction.map(plan => (
                    <div key={plan.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                      <h3 className="font-bold text-lg text-gray-900 mb-4">{plan.name}</h3>
                      <div className="space-y-3">
                        {plan.items.map(item => (
                          <div
                            key={item.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                              item.completed
                                ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                                item.completed
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'border-gray-300 bg-white'
                              }`}>
                                {item.completed && (
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className={`font-semibold text-base ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  {item.recipe.name}
                                </p>
                                <p className="text-sm text-gray-600 mt-0.5">
                                  {item.quantity} batch{item.quantity !== 1 ? 'es' : ''} × {item.recipe.yieldQuantity}{item.recipe.yieldUnit}
                                </p>
                              </div>
                            </div>
                            {!item.completed && (
                              <Link
                                href={`/dashboard/recipes/${item.recipe.id}`}
                                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors duration-200 mt-3 sm:mt-0"
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

          {/* This Week's Schedule - Compact */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">This Week</h2>
                  <p className="text-xs text-gray-600 mt-0.5">{weekProduction.length} plan{weekProduction.length !== 1 ? 's' : ''}</p>
                </div>
                <Link
                  href="/dashboard/production"
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  View All →
                </Link>
              </div>
            </div>
            <div className="p-4">
              {weekProduction.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">No plans this week</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {weekProduction.slice(0, 3).map(plan => (
                    <div key={plan.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-emerald-300 transition-all duration-200">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">{plan.name}</h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {new Date(plan.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                          {' - '}
                          {new Date(plan.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-emerald-600 font-medium mt-0.5">
                          {plan.items.length} recipe{plan.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* My Tasks */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">My Tasks</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Assigned to you</p>
                </div>
                <button
                  onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {showCompletedTasks ? 'Hide' : 'Show'} completed
                </button>
              </div>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              {displayTasks.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 mx-auto mb-2 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-xs font-medium">All tasks completed!</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {displayTasks.slice(0, 5).map(task => {
                    const isUrgent = task.dueDate && urgentTasks.some(t => t.id === task.id);
                    return (
                      <div
                        key={task.id}
                        className={`p-2.5 rounded-lg border transition-all duration-200 ${
                          task.completed
                            ? 'bg-gray-50 border-gray-200'
                            : isUrgent
                            ? 'bg-red-50 border-red-200'
                            : 'bg-emerald-50 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center mt-0.5 ${
                            task.completed
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-gray-300 bg-white'
                          }`}>
                            {task.completed && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs">
                              {task.dueDate && (
                                <span className={`flex items-center gap-0.5 ${isUrgent && !task.completed ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {new Date(task.dueDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              {task.assignedToName && (
                                <span className="flex items-center gap-0.5 text-gray-500 text-xs">
                                  {task.assignedToName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {displayTasks.length > 5 && (
                <div className="text-center pt-2 border-t border-gray-100 mt-2">
                  <button
                    onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    View all {displayTasks.length} tasks →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Price Alerts */}
          {staleIngredients.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden">
              <div className="p-3 border-b border-red-200 bg-gradient-to-r from-red-50 to-rose-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-red-900">Price Alerts</h2>
                    <p className="text-xs text-red-600">{staleIngredients.length} need updating</p>
                  </div>
                </div>
              </div>
              <div className="p-3 max-h-48 overflow-y-auto">
                <div className="space-y-1.5">
                  {staleIngredients.slice(0, 5).map(ingredient => (
                    <button
                      key={ingredient.id}
                      onClick={() => {
                        setSelectedIngredient(ingredient);
                        setIsModalOpen(true);
                      }}
                      className="w-full text-left block p-2 bg-red-50 border border-red-200 rounded-lg hover:border-red-300 hover:bg-red-100 transition-all duration-200"
                    >
                      <p className="text-xs font-semibold text-gray-900">{ingredient.name}</p>
                      <p className="text-xs text-red-600 mt-0.5">
                        {ingredient.daysSinceUpdate === Infinity 
                          ? 'Never updated' 
                          : ingredient.daysSinceUpdate === 0 
                          ? 'Today' 
                          : `${ingredient.daysSinceUpdate} days ago`}
                      </p>
                    </button>
                  ))}
                </div>
                {staleIngredients.length > 5 && (
                  <Link
                    href="/dashboard/ingredients"
                    className="block text-center text-xs text-red-600 hover:text-red-700 font-semibold mt-2 pt-2 border-t border-red-100"
                  >
                    View all {staleIngredients.length} →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Today's Timesheet - Compact */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Timesheet</h2>
                </div>
                <Link
                  href="/dashboard/timesheet"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  View →
                </Link>
              </div>
            </div>
            <div className="p-3">
              <div className="space-y-2">
                <button className="w-full px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200">
                  Clock In
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <p className="text-xs text-gray-600">Today</p>
                    <p className="text-sm font-bold text-gray-900">0h</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-center">
                    <p className="text-xs text-gray-600">Week</p>
                    <p className="text-sm font-bold text-gray-900">0h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Roster - Compact */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Team</h2>
                </div>
                <Link
                  href="/dashboard/team"
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  View →
                </Link>
              </div>
            </div>
            <div className="p-3">
              <div className="p-2.5 bg-gradient-to-r from-emerald-50 to-white rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                    {(userName?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{userName || 'You'}</p>
                    <p className="text-xs text-gray-600">{formatRole(userRole)}</p>
                  </div>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - Compact */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 rounded-xl shadow-xl overflow-hidden relative">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-white">Quick Actions</h3>
              </div>
              <div className="space-y-1.5">
                <Link
                  href="/dashboard/production"
                  className="block w-full py-2 px-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-center text-sm font-semibold transition-all duration-200 border border-white/30 hover:border-white/50"
                >
                  Plan Production
                </Link>
                <Link
                  href="/dashboard/recipes/new"
                  className="block w-full py-2 px-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-center text-sm font-semibold transition-all duration-200 border border-white/30 hover:border-white/50"
                >
                  New Recipe
                </Link>
                <Link
                  href="/dashboard/ingredients/new"
                  className="block w-full py-2 px-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-center text-sm font-semibold transition-all duration-200 border border-white/30 hover:border-white/50"
                >
                  Add Ingredient
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className="block w-full py-2 px-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-center text-sm font-semibold transition-all duration-200 border border-white/30 hover:border-white/50"
                >
                  Analytics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Price Confirmation Modal */}
      {selectedIngredient && (
        <PriceConfirmationModal
          ingredient={selectedIngredient}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedIngredient(null);
          }}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}


