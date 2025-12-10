"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PriceConfirmationModal } from "./PriceConfirmationModal";
import { useAppAwareRoute } from "@/lib/hooks/useAppAwareRoute";

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

interface WholesaleOrder {
  id: number;
  orderNumber: string | null;
  deliveryDate: string | null;
  status: string;
  customer: {
    id: number;
    name: string;
  };
  items: Array<{
    id: number;
    quantity: number;
    price: number | null;
    recipe: {
      id: number;
      name: string;
      yieldQuantity?: string;
    };
  }>;
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
  todayOrders: WholesaleOrder[];
  staleIngredients: StaleIngredient[];
  userName?: string;
  userRole?: string;
  companyName?: string;
  appName?: string;
  appTagline?: string;
}

export function OperationalDashboard({
  todayProduction = [],
  weekProduction = [],
  tasks = [],
  todayOrders = [],
  staleIngredients = [],
  userName,
  userRole,
  companyName,
  appName,
  appTagline,
}: OperationalDashboardProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<StaleIngredient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const { toAppRoute } = useAppAwareRoute();

  // Calculate stats
  const todayItems = (todayProduction || []).flatMap(plan => plan.items || []);
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

  const formatRole = (role?: string) => {
    if (!role) return 'Team Member';
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_production':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  try {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Simplified Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {appName ? `Welcome to ${appName}` : `Welcome back${userName ? `, ${userName}` : ''}!`}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                {appTagline && <span>{appTagline}</span>}
                {companyName && (
                  <>
                    {appTagline && <span>•</span>}
                    <span>{companyName}</span>
                  </>
                )}
                <span>•</span>
                <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </div>
            </div>
          </div>
        </div>

      {/* Floating Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Tile 1: Today's Production Plan */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200/50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Today's Production</h2>
              <Link
                href={toAppRoute("/dashboard/production")}
                className="text-xs sm:text-sm text-[var(--brand-primary)] hover:text-[var(--brand-accent)] font-medium"
              >
                View All →
              </Link>
            </div>
            {todayTotal > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] h-full transition-all duration-300"
                    style={{ width: `${todayProgress}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700">{todayProgress}%</span>
              </div>
            )}
          </div>
          <div className="p-4 sm:p-6">
            {todayProduction.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm mb-4">No production scheduled for today</p>
                <Link
                  href={toAppRoute("/dashboard/production")}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all duration-200"
                >
                  Create Plan
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {todayProduction.map(plan => (
                  <div key={plan.id} className="space-y-2">
                    <h3 className="font-semibold text-sm text-gray-900">{plan.name}</h3>
                    <div className="space-y-2">
                      {plan.items.slice(0, 3).map(item => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                            item.completed
                              ? 'bg-green-50/50 border-green-200/50'
                              : 'bg-white border-gray-200 hover:border-[var(--brand-primary)]/50 hover:shadow-sm'
                          }`}
                        >
                          <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                            item.completed
                              ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)]'
                              : 'border-gray-300 bg-white'
                          }`}>
                            {item.completed && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {item.recipe.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {item.quantity} × {item.recipe.yieldQuantity}{item.recipe.yieldUnit}
                            </p>
                          </div>
                        </div>
                      ))}
                      {plan.items.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">+{plan.items.length - 3} more items</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tile 2: This Week's Production */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200/50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">This Week</h2>
              <Link
                href={toAppRoute("/dashboard/production")}
                className="text-xs sm:text-sm text-[var(--brand-primary)] hover:text-[var(--brand-accent)] font-medium"
              >
                View All →
              </Link>
            </div>
            <p className="text-xs text-gray-600">{weekProduction.length} plan{weekProduction.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="p-4 sm:p-6">
            {weekProduction.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No plans this week</p>
              </div>
            ) : (
              <div className="space-y-3">
                {weekProduction.slice(0, 4).map(plan => (
                  <div
                    key={plan.id}
                    className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:border-[var(--brand-primary)]/50 transition-all duration-200"
                  >
                    <h3 className="font-semibold text-sm text-gray-900 mb-1">{plan.name}</h3>
                    <p className="text-xs text-gray-600 mb-1">
                      {new Date(plan.startDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                      {' - '}
                      {new Date(plan.endDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-[var(--brand-primary)] font-medium">
                      {plan.items.length} recipe{plan.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
                {weekProduction.length > 4 && (
                  <p className="text-xs text-gray-500 text-center">+{weekProduction.length - 4} more plans</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tile 3: Orders Due Today */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200/50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Orders Due Today</h2>
              <Link
                href={toAppRoute("/dashboard/wholesale/orders")}
                className="text-xs sm:text-sm text-[var(--brand-primary)] hover:text-[var(--brand-accent)] font-medium"
              >
                View All →
              </Link>
            </div>
            <p className="text-xs text-gray-600">{todayOrders.length} order{todayOrders.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="p-4 sm:p-6">
            {todayOrders.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">No orders due today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-3 bg-white rounded-xl border border-gray-200 hover:border-[var(--brand-primary)]/50 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">{order.customer?.name || 'Unknown Customer'}</h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {order.orderNumber || `Order #${order.id}`}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(order.status || 'pending')}`}>
                        {(order.status || 'pending').replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tile 4: What Needs to Be Done */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 overflow-hidden md:col-span-2 lg:col-span-1">
          <div className="p-4 sm:p-6 border-b border-gray-200/50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">What Needs to Be Done</h2>
              {urgentTasks.length > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-lg">
                  {urgentTasks.length} urgent
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600">{pendingTasks.length} task{pendingTasks.length !== 1 ? 's' : ''} pending</p>
          </div>
          <div className="p-4 sm:p-6 max-h-96 overflow-y-auto">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm font-medium">All tasks completed!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.slice(0, 6).map(task => {
                  const isUrgent = task.dueDate && urgentTasks.some(t => t.id === task.id);
                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border transition-all duration-200 ${
                        isUrgent
                          ? 'bg-red-50/50 border-red-200/50'
                          : 'bg-white border-gray-200 hover:border-[var(--brand-primary)]/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300 bg-white mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isUrgent ? 'text-red-900' : 'text-gray-900'}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {task.dueDate && (
                              <span className={`flex items-center gap-1 text-xs ${isUrgent ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(task.dueDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">{task.planName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {pendingTasks.length > 6 && (
                  <Link
                    href={toAppRoute("/dashboard/production")}
                    className="block text-center text-xs text-[var(--brand-primary)] hover:text-[var(--brand-accent)] font-medium pt-2 border-t border-gray-200"
                  >
                    View all {pendingTasks.length} tasks →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tile 5: Quick Stats (Compact) */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-200 overflow-hidden md:col-span-2 lg:col-span-2">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Quick Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-[var(--brand-primary)]/10 to-[var(--brand-accent)]/10 rounded-xl border border-[var(--brand-primary)]/20">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{todayProgress}%</p>
                <p className="text-xs text-gray-600 mt-1">Today's Progress</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-xl border border-amber-500/20">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{pendingTasks.length}</p>
                <p className="text-xs text-gray-600 mt-1">Pending Tasks</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-xl border border-blue-500/20">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{todayOrders.length}</p>
                <p className="text-xs text-gray-600 mt-1">Orders Today</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-xl border border-purple-500/20">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{weekProduction.length}</p>
                <p className="text-xs text-gray-600 mt-1">Week Plans</p>
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
  } catch (error) {
    console.error('Error rendering OperationalDashboard:', error);
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-bold text-red-900 mb-2">Error Loading Dashboard</h2>
        <p className="text-red-700">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }
}
