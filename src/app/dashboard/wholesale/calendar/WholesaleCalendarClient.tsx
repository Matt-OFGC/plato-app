"use client";

import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, isSameDay, addDays, subDays, addMonths, subMonths, addYears, subYears, isToday, isPast, isFuture } from "date-fns";
import { WholesaleOrders } from "@/components/WholesaleOrders";
import { CustomOrderForm } from "@/components/CustomOrderForm";
import { useRouter } from "next/navigation";

interface Order {
  id: number;
  orderNumber: string | null;
  deliveryDate: Date | null;
  status: string;
  customer: {
    id: number;
    name: string;
    email: string | null;
  };
  items: Array<{
    id: number;
    quantity: number;
    recipe: {
      id: number;
      name: string;
      yieldQuantity: string;
      yieldUnit: string;
    };
  }>;
}

interface Customer {
  id: number;
  name: string;
  deliveryDays?: string[];
  preferredDeliveryTime?: string | null;
}

interface Product {
  id: number;
  recipeId: number | null;
  name: string;
  price: string;
  imageUrl?: string | null;
}

interface WholesaleCalendarClientProps {
  orders: Order[];
  customers: Customer[];
  products: Product[];
  companyId: number;
}

type ViewMode = "week" | "month" | "year";

export default function WholesaleCalendarClient({
  orders: initialOrders,
  customers,
  products,
  companyId,
}: WholesaleCalendarClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Get date range based on view mode
  const dateRange = useMemo(() => {
    switch (viewMode) {
      case "week":
        return {
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 }),
        };
      case "month":
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        };
      case "year":
        return {
          start: startOfYear(currentDate),
          end: endOfYear(currentDate),
        };
    }
  }, [currentDate, viewMode]);

  // Get orders for the current view
  const visibleOrders = useMemo(() => {
    return orders.filter(order => {
      if (!order.deliveryDate) return false;
      const deliveryDate = new Date(order.deliveryDate);
      return deliveryDate >= dateRange.start && deliveryDate <= dateRange.end;
    });
  }, [orders, dateRange]);

  // Group orders by date
  const ordersByDate = useMemo(() => {
    const grouped = new Map<string, Order[]>();
    visibleOrders.forEach(order => {
      if (order.deliveryDate) {
        const dateKey = format(new Date(order.deliveryDate), "yyyy-MM-dd");
        const existing = grouped.get(dateKey) || [];
        existing.push(order);
        grouped.set(dateKey, existing);
      }
    });
    return grouped;
  }, [visibleOrders]);

  // Get calendar days based on view mode
  const calendarDays = useMemo(() => {
    if (viewMode === "week") {
      return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    } else if (viewMode === "month") {
      // Include days from previous/next month to fill the week
      const start = startOfWeek(dateRange.start, { weekStartsOn: 1 });
      const end = endOfWeek(dateRange.end, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      // Year view - show months
      return [];
    }
  }, [viewMode, dateRange]);

  function handleDateClick(date: Date) {
    setSelectedDate(date);
    setShowOrderModal(true);
  }

  function handleOrderClick(order: Order) {
    setSelectedOrder(order);
    router.push(`/dashboard/wholesale/orders?orderId=${order.id}`);
  }

  function navigateDate(direction: "prev" | "next") {
    if (viewMode === "week") {
      setCurrentDate(direction === "next" ? addDays(currentDate, 7) : subDays(currentDate, 7));
    } else if (viewMode === "month") {
      setCurrentDate(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === "next" ? addYears(currentDate, 1) : subYears(currentDate, 1));
    }
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "in_production":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "ready":
        return "bg-green-100 text-green-800 border-green-300";
      case "delivered":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wholesale Calendar</h1>
          <p className="text-gray-600 mt-1">View and manage orders by delivery date</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/wholesale/orders")}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            List View
          </button>
          <button
            onClick={() => setShowOrderModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Create Custom Order
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateDate("prev")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900 min-w-[200px] text-center">
              {viewMode === "week" && format(dateRange.start, "MMM d") + " - " + format(dateRange.end, "MMM d, yyyy")}
              {viewMode === "month" && format(currentDate, "MMMM yyyy")}
              {viewMode === "year" && format(currentDate, "yyyy")}
            </h2>
            <button
              onClick={() => navigateDate("next")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="ml-4 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === "week" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === "month" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("year")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === "year" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Year
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        {viewMode === "year" ? (
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 12 }, (_, i) => {
              const monthDate = new Date(currentDate.getFullYear(), i, 1);
              const monthOrders = orders.filter(order => {
                if (!order.deliveryDate) return false;
                const delivery = new Date(order.deliveryDate);
                return delivery.getMonth() === i && delivery.getFullYear() === currentDate.getFullYear();
              });
              return (
                <div
                  key={i}
                  onClick={() => {
                    setCurrentDate(monthDate);
                    setViewMode("month");
                  }}
                  className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all cursor-pointer"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{format(monthDate, "MMMM")}</h3>
                  <div className="text-sm text-gray-600">
                    {monthOrders.length} order{monthOrders.length !== 1 ? "s" : ""}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayOrders = ordersByDate.get(dateKey) || [];
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                      !isCurrentMonth ? "bg-gray-50 opacity-60" : "bg-white"
                    } ${isCurrentDay ? "bg-green-50" : ""} hover:bg-gray-50 transition-colors cursor-pointer`}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className={`text-sm font-medium mb-1 ${isCurrentDay ? "text-green-600 font-bold" : "text-gray-700"}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayOrders.slice(0, 3).map((order) => (
                        <div
                          key={order.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderClick(order);
                          }}
                          className={`text-xs p-1 rounded border ${getStatusColor(order.status)} cursor-pointer hover:shadow-sm transition-shadow`}
                          title={`${order.customer.name} - ${order.items.length} item${order.items.length !== 1 ? "s" : ""}`}
                        >
                          <div className="font-medium truncate">{order.customer.name}</div>
                          <div className="text-xs opacity-75">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</div>
                        </div>
                      ))}
                      {dayOrders.length > 3 && (
                        <div className="text-xs text-gray-500 font-medium">
                          +{dayOrders.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{visibleOrders.length}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {visibleOrders.filter(o => o.status === "pending" || o.status === "confirmed").length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {visibleOrders.filter(o => o.status === "in_production").length}
            </div>
            <div className="text-sm text-gray-600">In Production</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {visibleOrders.filter(o => o.status === "delivered").length}
            </div>
            <div className="text-sm text-gray-600">Delivered</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
              router.push(`/dashboard/production?fromOrders=true&orderIds=${visibleOrders.filter(o => {
                if (!o.deliveryDate) return false;
                const delivery = new Date(o.deliveryDate);
                return delivery >= weekStart && delivery <= endOfWeek(weekStart, { weekStartsOn: 1 });
              }).map(o => o.id).join(",")}`);
            }}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
          >
            <div className="font-semibold text-blue-900 mb-1">Add to Production</div>
            <div className="text-sm text-blue-700">Import orders for this week into production plan</div>
          </button>
          <button
            onClick={() => router.push("/dashboard/wholesale/invoices")}
            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
          >
            <div className="font-semibold text-green-900 mb-1">View Invoices</div>
            <div className="text-sm text-green-700">Manage invoices and payments</div>
          </button>
          <button
            onClick={() => router.push("/dashboard/wholesale/customers")}
            className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left"
          >
            <div className="font-semibold text-purple-900 mb-1">Manage Customers</div>
            <div className="text-sm text-purple-700">Add or edit wholesale customers</div>
          </button>
        </div>
      </div>

      {/* Order Creation Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl">
            <CustomOrderForm
              companyId={companyId}
              customers={customers}
              products={products}
              defaultDeliveryDate={selectedDate || undefined}
              onClose={() => {
                setShowOrderModal(false);
                setSelectedDate(null);
                router.refresh();
              }}
              onOrderCreated={(newOrder) => {
                setOrders([...orders, newOrder]);
                setShowOrderModal(false);
                setSelectedDate(null);
                router.refresh();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
