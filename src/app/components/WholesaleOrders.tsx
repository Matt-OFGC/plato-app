"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppAwareRoute } from "@/lib/hooks/useAppAwareRoute";
import { format } from "date-fns";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SearchableSelect } from "./SearchableSelect";

interface Product {
  id: number;
  recipeId: number | null;
  name: string;
  description: string | null;
  yieldQuantity: string;
  yieldUnit: string;
  unit: string | null;
  price: string;
  category: string | null;
}

interface OrderItem {
  id: number;
  recipeId: number;
  quantity: number;
  notes: string | null;
  recipe: {
    id: number;
    name: string;
    yieldQuantity: string;
    yieldUnit: string;
  };
}

interface WholesaleOrder {
  id: number;
  createdAt: Date;
  orderNumber: string | null;
  deliveryDate: Date | null;
  status: string;
  notes: string | null;
  customer: {
    id: number;
    name: string;
    contactName: string | null;
    email: string | null;
    phone: string | null;
  };
  items: OrderItem[];
}

interface Customer {
  id: number;
  name: string;
  contactName: string | null;
  email: string | null;
}

interface WholesaleOrdersProps {
  orders: WholesaleOrder[];
  customers: Customer[];
  products: Product[];
  companyId: number;
}

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "confirmed", label: "Confirmed", color: "blue" },
  { value: "in_production", label: "In Production", color: "purple" },
  { value: "ready", label: "Ready", color: "green" },
  { value: "delivered", label: "Delivered", color: "gray" },
  { value: "cancelled", label: "Cancelled", color: "red" },
];

// Sortable day item component
function SortableDayItem({ 
  item, 
  day,
  onRemove,
  onUpdateQuantity 
}: { 
  item: { productId: number; productName: string; quantity: number; id: string };
  day: string;
  onRemove: () => void;
  onUpdateQuantity: (qty: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
        <p className="text-xs font-medium text-gray-900 flex-1 truncate" title={item.productName}>
          {item.productName}
        </p>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 p-0.5"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <input
        type="number"
        min="1"
        value={item.quantity}
        onChange={(e) => onUpdateQuantity(parseInt(e.target.value) || 1)}
        className="w-full px-2 py-1 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
      />
    </div>
  );
}

function DroppableDay({ 
  day, 
  items, 
  onRemove, 
  onUpdateQuantity,
  orderItems,
  addProductToDay,
  products
}: { 
  day: string;
  items: { productId: number; productName: string; quantity: number; id: string }[];
  onRemove: (day: string, id: string) => void;
  onUpdateQuantity: (day: string, id: string, qty: number) => void;
  orderItems: Map<number, any>;
  addProductToDay: (productId: number, day: string, quantity?: number) => void;
  products: Product[];
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: day,
  });

  const allItemIds = items.map(item => item.id);

  return (
    <div 
      ref={setNodeRef}
      className={`bg-white rounded-lg p-3 border-2 min-h-[200px] transition-colors ${
        isOver ? 'border-purple-400 bg-purple-50' : 'border-purple-200'
      }`}
    >
      <h4 className="font-bold text-sm text-purple-900 mb-2 text-center border-b border-purple-200 pb-2">
        {day}
      </h4>
      
      <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[150px]">
          {items.map((item) => (
            <SortableDayItem
              key={item.id}
              item={item}
              day={day}
              onRemove={() => onRemove(day, item.id)}
              onUpdateQuantity={(qty) => onUpdateQuantity(day, item.id, qty)}
            />
          ))}
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs">
              {isOver ? "Drop here" : "Drag items here"}
            </div>
          )}
        </div>
      </SortableContext>

      {/* Quick Add Buttons */}
      {Array.from(orderItems.keys()).length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <select
            onChange={(e) => {
              const productId = parseInt(e.target.value);
              if (productId) {
                addProductToDay(productId, day);
                e.target.value = "";
              }
            }}
            className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500"
          >
            <option value="">+ Add item...</option>
            {Array.from(orderItems.keys()).map(productId => {
              const product = products.find(p => p.id === productId);
              if (!product) return null;
              return (
                <option key={productId} value={productId}>{product.name}</option>
              );
            })}
          </select>
        </div>
      )}
    </div>
  );
}

export function WholesaleOrders({
  orders: initialOrders,
  customers,
  products,
  companyId,
}: WholesaleOrdersProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WholesaleOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<WholesaleOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [productSearch, setProductSearch] = useState("");
  const [recipeSearchResults, setRecipeSearchResults] = useState<any[]>([]);
  const [isSearchingRecipes, setIsSearchingRecipes] = useState(false);

  // Form state
  const [customerId, setCustomerId] = useState<number>(0);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [status, setStatus] = useState("pending");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderItems, setOrderItems] = useState<Map<number, { quantity: number; notes: string; weeklySchedule?: Record<string, number> }>>(new Map());
  
  // Recurring order state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState("weekly");
  const [recurringIntervalDays, setRecurringIntervalDays] = useState<number>(7);
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [recurringStatus, setRecurringStatus] = useState("active");
  
  // Weekly schedule state
  const [showWeeklySchedule, setShowWeeklySchedule] = useState(false);
  const [weeklyAllocations, setWeeklyAllocations] = useState<Record<string, Array<{ productId: number; productName: string; quantity: number; id: string }>>>({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function openModal(order?: WholesaleOrder) {
    if (order) {
      setEditingOrder(order);
      setCustomerId(order.customer.id);
      setDeliveryDate(order.deliveryDate ? format(new Date(order.deliveryDate), "yyyy-MM-dd") : "");
      setStatus(order.status);
      setOrderNotes(order.notes || "");
      setIsRecurring((order as any).isRecurring || false);
      setRecurringInterval((order as any).recurringInterval || "weekly");
      setRecurringIntervalDays((order as any).recurringIntervalDays || 7);
      setRecurringEndDate((order as any).recurringEndDate ? format(new Date((order as any).recurringEndDate), "yyyy-MM-dd") : "");
      setRecurringStatus((order as any).recurringStatus || "active");
      
      const items = new Map();
      order.items.forEach(item => {
        items.set(item.recipeId, { quantity: item.quantity, notes: item.notes || "" });
      });
      setOrderItems(items);
    } else {
      setEditingOrder(null);
      setCustomerId(customers[0]?.id || 0);
      setDeliveryDate("");
      setStatus("pending");
      setOrderNotes("");
      setOrderItems(new Map());
      setIsRecurring(false);
      setRecurringInterval("weekly");
      setRecurringIntervalDays(7);
      setRecurringEndDate("");
      setRecurringStatus("active");
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingOrder(null);
  }

  function updateItemQuantity(productId: number, quantity: number) {
    const newItems = new Map(orderItems);
    if (quantity <= 0) {
      newItems.delete(productId);
    } else {
      const existing = orderItems.get(productId) || { quantity: 0, notes: "", weeklySchedule: {} };
      newItems.set(productId, { ...existing, quantity });
    }
    setOrderItems(newItems);
  }

  function updateWeeklySchedule(productId: number, day: string, dayQuantity: number) {
    const newItems = new Map(orderItems);
    const existing = orderItems.get(productId);
    if (existing) {
      const weeklySchedule = { ...existing.weeklySchedule, [day]: dayQuantity };
      newItems.set(productId, { ...existing, weeklySchedule });
      setOrderItems(newItems);
    }
  }

  function addProductToDay(productId: number, day: string, quantity: number = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setWeeklyAllocations(prev => ({
      ...prev,
      [day]: [...prev[day], {
        productId,
        productName: product.name,
        quantity,
        id: `${day}-${productId}-${Date.now()}`,
      }],
    }));
  }

  function removeProductFromDay(day: string, itemId: string) {
    setWeeklyAllocations(prev => ({
      ...prev,
      [day]: prev[day].filter(item => item.id !== itemId),
    }));
  }

  function updateDayItemQuantity(day: string, itemId: string, quantity: number) {
    setWeeklyAllocations(prev => ({
      ...prev,
      [day]: prev[day].map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ),
    }));
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which day the active item is from
    let sourceDay = "";
    let activeItem: any = null;

    for (const day of DAYS_OF_WEEK) {
      const item = weeklyAllocations[day].find(i => i.id === activeId);
      if (item) {
        sourceDay = day;
        activeItem = item;
        break;
      }
    }

    if (!sourceDay || !activeItem) return;

    // Determine target day - check if overId is a day name or an item in a day
    let targetDay = "";
    
    // First check if overId is directly a day name
    if (DAYS_OF_WEEK.includes(overId)) {
      targetDay = overId;
    } else {
      // Check if overId is an item that belongs to a day
      for (const day of DAYS_OF_WEEK) {
        const itemInDay = weeklyAllocations[day].find(i => i.id === overId);
        if (itemInDay) {
          targetDay = day;
          break;
        }
      }
    }

    if (targetDay && sourceDay !== targetDay) {
      // Moving to a different day - create new item with unique ID
      setWeeklyAllocations(prev => ({
        ...prev,
        [sourceDay]: prev[sourceDay].filter(i => i.id !== activeId),
        [targetDay]: [...prev[targetDay], { 
          ...activeItem, 
          id: `${targetDay}-${activeItem.productId}-${Date.now()}` 
        }],
      }));
    }
  }

  // Calculate total quantities from weekly allocations
  function getTotalAllocatedForProduct(productId: number): number {
    let total = 0;
    DAYS_OF_WEEK.forEach(day => {
      weeklyAllocations[day].forEach(item => {
        if (item.productId === productId) {
          total += item.quantity;
        }
      });
    });
    return total;
  }

  async function generateInvoice(orderId: number) {
    if (!confirm("Create an invoice for this order?")) return;

    try {
      const res = await fetch(`/api/wholesale/orders/${orderId}/create-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const invoice = await res.json();
        alert(`Invoice ${invoice.invoiceNumber} created successfully!`);
        // Optionally redirect to invoice page
        window.location.href = `/dashboard/wholesale/invoices`;
      } else {
        const data = await res.json();
        if (data.error?.includes("already exists")) {
          alert(data.error + ". Invoice ID: " + data.invoiceId);
        } else {
          alert(data.error || "Failed to create invoice");
        }
      }
    } catch (error) {
      alert("Network error");
    }
  }

  async function handleSave() {
    if (customerId === 0) {
      alert("Please select a customer");
      return;
    }

    if (orderItems.size === 0) {
      alert("Please add at least one item");
      return;
    }

    setSaving(true);

    try {
      // Map product IDs to recipe IDs for the order
      // Use wholesale price from product or recipe
      const items = Array.from(orderItems.entries()).map(([productId, data]) => {
        // Handle recipes added directly (negative IDs) vs wholesale products (positive IDs)
        if (productId < 0) {
          // This is a recipe added directly from search
          const recipeId = Math.abs(productId);
          // Fetch recipe wholesale price if not already stored
          const recipe = recipeSearchResults.find(r => r.id === recipeId);
          return {
            recipeId: data.recipeId || recipeId,
            quantity: data.quantity,
            price: recipe?.wholesalePrice ? Number(recipe.wholesalePrice) : null,
            notes: data.notes || null,
          };
        } else {
          // This is a wholesale product
          const product = products.find(p => p.id === productId);
          // Use product price (which comes from WholesaleProduct or Recipe.wholesalePrice)
          const price = product?.price || null;
          return {
            recipeId: product?.recipeId || productId,
            quantity: data.quantity,
            price: price ? parseFloat(price) : null,
            notes: data.notes || null,
          };
        }
      });

      const url = editingOrder
        ? `/api/wholesale/orders/${editingOrder.id}`
        : "/api/wholesale/orders";
      
      const method = editingOrder ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          companyId,
          deliveryDate: deliveryDate || null,
          status,
          notes: orderNotes || null,
          items,
          isRecurring,
          recurringInterval: isRecurring ? recurringInterval : null,
          recurringIntervalDays: isRecurring && recurringInterval === "custom" ? recurringIntervalDays : null,
          recurringEndDate: isRecurring && recurringEndDate ? recurringEndDate : null,
          recurringStatus: isRecurring ? recurringStatus : null,
        }),
      });

      if (res.ok) {
        const order = await res.json();
        
        if (editingOrder) {
          setOrders(orders.map(o => o.id === editingOrder.id ? order : o));
        } else {
          setOrders([order, ...orders]);
        }
        
        closeModal();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save order");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this order? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/wholesale/orders/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setOrders(orders.filter(o => o.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete order");
      }
    } catch (error) {
      alert("Network error");
    }
  }

  async function updateOrderStatus(id: number, newStatus: string) {
    try {
      const res = await fetch(`/api/wholesale/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(orders.map(o => o.id === id ? updatedOrder : o));
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  const filteredOrders = filterStatus === "all" 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  const getStatusColor = (status: string) => {
    const statusConfig = ORDER_STATUSES.find(s => s.value === status);
    return statusConfig?.color || "gray";
  };

  const getStatusBgClass = (color: string) => {
    const classes: Record<string, string> = {
      yellow: "bg-yellow-100 text-yellow-800",
      blue: "bg-blue-100 text-blue-800",
      purple: "bg-purple-100 text-purple-800",
      green: "bg-green-100 text-green-800",
      gray: "bg-gray-100 text-gray-800",
      red: "bg-red-100 text-red-800",
    };
    return classes[color] || classes.gray;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Order
          </button>

          <button
            onClick={() => {
              const route = toAppRoute(`/dashboard/production?fromOrders=true&orderIds=${filteredOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').map(o => o.id).join(',')}`);
              window.location.href = route;
            }}
            disabled={filteredOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add pending/confirmed orders to production plan"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Add to Production
          </button>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Orders</option>
            {ORDER_STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-600">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{order.customer.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBgClass(getStatusColor(order.status))}`}>
                      {ORDER_STATUSES.find(s => s.value === order.status)?.label || order.status}
                    </span>
                    {(order as any).isRecurring && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium" title="Recurring Order">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Recurring
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Placed: {format(new Date(order.createdAt), "MMM d, yyyy")}</span>
                    {order.deliveryDate && (
                      <span>Delivery: {format(new Date(order.deliveryDate), "MMM d, yyyy")}</span>
                    )}
                    <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                  >
                    {ORDER_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setViewingOrder(order)}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    title="View Details"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => openModal(order)}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => generateInvoice(order.id)}
                    className="p-2 text-green-600 hover:text-green-700 transition-colors"
                    title="Create Invoice"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="space-y-2">
                {order.items.slice(0, 3).map((item) => {
                  const batchesNeeded = Math.ceil(item.quantity / parseFloat(item.recipe.yieldQuantity));
                  return (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{item.recipe.name}</span>
                      <div className="text-right">
                        <span className="text-gray-900 font-medium">{item.quantity} {item.recipe.yieldUnit}</span>
                        <span className="text-gray-500 text-xs ml-2">({batchesNeeded} batch{batchesNeeded !== 1 ? 'es' : ''})</span>
                      </div>
                    </div>
                  );
                })}
                {order.items.length > 3 && (
                  <p className="text-sm text-gray-500">+{order.items.length - 3} more...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Order Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingOrder ? "Edit Order" : "New Order"}
                  </h2>
                  <button
                    onClick={() => setShowWeeklySchedule(!showWeeklySchedule)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
                      showWeeklySchedule 
                        ? "bg-purple-100 text-purple-700" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {showWeeklySchedule ? "Hide" : "Show"} Weekly Schedule
                  </button>
                </div>
              </div>

              <div className="flex max-h-[calc(90vh-200px)]">
                {/* Left Side - Order Details */}
                <div className={`p-6 space-y-4 overflow-y-auto ${showWeeklySchedule ? 'w-1/2 border-r' : 'w-full'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect
                      options={customers.map(c => ({ id: c.id, name: c.name }))}
                      value={customerId === 0 ? undefined : customerId}
                      onChange={(value) => setCustomerId(value || 0)}
                      placeholder="Select a customer..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      {ORDER_STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Notes
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Special instructions or notes..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Recurring Order Section */}
                  <div className="md:col-span-2 border-t pt-4 mt-2">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isRecurring}
                          onChange={(e) => setIsRecurring(e.target.checked)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-gray-900">Make this a recurring order</span>
                      </label>
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>

                    {isRecurring && (
                      <div className="space-y-3 pl-6 border-l-2 border-green-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Repeat Interval
                          </label>
                          <select
                            value={recurringInterval}
                            onChange={(e) => {
                              setRecurringInterval(e.target.value);
                              // Set default interval days based on selection
                              if (e.target.value === "weekly") setRecurringIntervalDays(7);
                              else if (e.target.value === "biweekly") setRecurringIntervalDays(14);
                              else if (e.target.value === "monthly") setRecurringIntervalDays(30);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                          >
                            <option value="weekly">Weekly (every 7 days)</option>
                            <option value="biweekly">Every 2 weeks (14 days)</option>
                            <option value="monthly">Monthly (30 days)</option>
                            <option value="custom">Custom interval</option>
                          </select>
                        </div>

                        {recurringInterval === "custom" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Custom Interval (days)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={recurringIntervalDays}
                              onChange={(e) => setRecurringIntervalDays(parseInt(e.target.value) || 7)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date (Optional)
                          </label>
                          <input
                            type="date"
                            value={recurringEndDate}
                            onChange={(e) => setRecurringEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                          />
                          <p className="text-xs text-gray-500 mt-1">Leave empty for no end date</p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-blue-800">
                              This order will automatically repeat at the specified interval. You can pause or cancel it anytime.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Order Items <span className="text-red-500">*</span></h3>
                    {orderItems.size > 0 && (
                      <button
                        onClick={() => setShowWeeklySchedule(!showWeeklySchedule)}
                        className="px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors font-medium"
                      >
                        {showWeeklySchedule ? "Hide" : "Show"} Weekly Schedule
                      </button>
                    )}
                  </div>

                  {/* Product Search */}
                  <div className="mb-3">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={productSearch}
                        onChange={async (e) => {
                          const searchValue = e.target.value;
                          setProductSearch(searchValue);
                          
                          // Search recipes from database if search term is long enough
                          if (searchValue.length >= 2) {
                            setIsSearchingRecipes(true);
                            try {
                              const response = await fetch(`/api/recipes?search=${encodeURIComponent(searchValue)}&companyId=${companyId}&limit=20`);
                              if (response.ok) {
                                const data = await response.json();
                                setRecipeSearchResults(data.recipes || []);
                              }
                            } catch (error) {
                              console.error('Failed to search recipes:', error);
                            } finally {
                              setIsSearchingRecipes(false);
                            }
                          } else {
                            setRecipeSearchResults([]);
                          }
                        }}
                        placeholder="Quick search products or recipes..."
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                      {isSearchingRecipes && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Show recipe search results */}
                    {recipeSearchResults.length > 0 && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-medium text-blue-900 mb-1">Recipes from your database:</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {recipeSearchResults.map((recipe) => {
                            // Check if this recipe is already in products (as a wholesale product)
                            const existingProduct = products.find(p => p.recipeId === recipe.id);
                            if (existingProduct) {
                              // If it exists as a wholesale product, use that product ID
                              return (
                                <button
                                  key={recipe.id}
                                  onClick={() => {
                                    updateItemQuantity(existingProduct.id, 1);
                                    setProductSearch("");
                                    setRecipeSearchResults([]);
                                  }}
                                  className="w-full text-left px-2 py-1 text-xs bg-white hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                                >
                                  <span className="font-medium text-gray-900">{recipe.name}</span>
                                  {recipe.category && (
                                    <span className="text-gray-500 ml-1">• {recipe.category}</span>
                                  )}
                                  <span className="text-blue-600 ml-1 text-xs">(Already in catalogue)</span>
                                </button>
                              );
                            }
                            
                            // Recipe not in wholesale products - add directly using recipe ID
                            // Use negative recipe ID to distinguish from product IDs
                            const recipeOrderId = -recipe.id;
                            const alreadyInOrder = orderItems.has(recipeOrderId);
                            
                            return (
                              <button
                                key={recipe.id}
                                onClick={() => {
                                  // Add recipe directly to order items using negative ID
                                  const newItems = new Map(orderItems);
                                  const existing = orderItems.get(recipeOrderId);
                                  const quantity = existing ? existing.quantity + 1 : 1;
                                  newItems.set(recipeOrderId, { 
                                    quantity, 
                                    notes: "",
                                    recipeId: recipe.id, // Store actual recipe ID for saving
                                  });
                                  setOrderItems(newItems);
                                  
                                  // Clear search
                                  setProductSearch("");
                                  setRecipeSearchResults([]);
                                }}
                                disabled={alreadyInOrder}
                                className={`w-full text-left px-2 py-1 text-xs rounded border transition-colors ${
                                  alreadyInOrder 
                                    ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                                    : 'bg-white hover:bg-blue-100 border-blue-200'
                                }`}
                              >
                                <span className="font-medium text-gray-900">{recipe.name}</span>
                                {recipe.category && (
                                  <span className="text-gray-500 ml-1">• {recipe.category}</span>
                                )}
                                {recipe.wholesalePrice ? (
                                  <span className="text-green-700 ml-1 font-semibold">£{Number(recipe.wholesalePrice).toFixed(2)}</span>
                                ) : (
                                  <span className="text-orange-600 ml-1 text-xs">(No wholesale price set)</span>
                                )}
                                {alreadyInOrder && (
                                  <span className="text-blue-600 ml-1 text-xs">(In order)</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {/* Show recipes added directly from search (negative IDs) */}
                    {Array.from(orderItems.entries())
                      .filter(([productId]) => productId < 0)
                      .map(([productId, item]) => {
                        const recipeId = Math.abs(productId);
                        const recipe = recipeSearchResults.find(r => r.id === recipeId);
                        if (!recipe) return null;
                        
                        return (
                          <div
                            key={productId}
                            className="flex items-center justify-between p-3 border border-blue-300 bg-blue-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{recipe.name}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span className="font-semibold text-green-700">
                                  £{recipe.wholesalePrice ? Number(recipe.wholesalePrice).toFixed(2) : "0.00"} each
                                </span>
                                {recipe.category && (
                                  <>
                                    <span>•</span>
                                    <span>{recipe.category}</span>
                                  </>
                                )}
                                <span className="text-xs text-blue-600">(From recipe database)</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateItemQuantity(productId, item.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={item.quantity || ""}
                                onChange={(e) => updateItemQuantity(productId, parseInt(e.target.value) || 0)}
                                placeholder="0"
                                className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                              />
                              <button
                                onClick={() => updateItemQuantity(productId, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    
                    {/* Show wholesale products */}
                    {products
                      .filter(product => 
                        productSearch === "" ||
                        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        product.category?.toLowerCase().includes(productSearch.toLowerCase())
                      )
                      .map((product) => {
                        const item = orderItems.get(product.id);
                        const quantity = item?.quantity || 0;
                        
                        return (
                          <div
                            key={product.id}
                            className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                              quantity > 0 ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span className="font-semibold text-green-700">£{parseFloat(product.price).toFixed(2)} {product.unit || 'each'}</span>
                                {product.category && (
                                  <>
                                    <span>•</span>
                                    <span>{product.category}</span>
                                  </>
                                )}
                                {product.recipeId && (
                                  <>
                                    <span>•</span>
                                    <span className="text-xs text-gray-400">Batch makes {product.yieldQuantity} {product.yieldUnit}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateItemQuantity(product.id, quantity - 1)}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={quantity || ""}
                                  onChange={(e) => updateItemQuantity(product.id, parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                  className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                                />
                                <button
                                  onClick={() => updateItemQuantity(product.id, quantity + 1)}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200"
                                >
                                  +
                                </button>
                              </div>
                              {quantity > 0 && showWeeklySchedule && (
                                <button
                                  onClick={() => addProductToDay(product.id, "Monday", quantity)}
                                  className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors font-medium"
                                  title="Add to Monday"
                                >
                                  → Schedule
                                </button>
                              )}
                            </div>
                          </div>
                        );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Side - Weekly Schedule (Drag & Drop) */}
              {showWeeklySchedule && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div className="w-1/2 p-6 bg-purple-50 overflow-y-auto">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Weekly Production Schedule
                    </h3>
                    <p className="text-xs text-gray-600 mb-4">
                      Click items on the left to add, then drag between days to schedule production
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      {DAYS_OF_WEEK.map((day) => {
                        const dayItems = weeklyAllocations[day];

                        return (
                          <DroppableDay
                            key={day}
                            day={day}
                            items={dayItems}
                            onRemove={removeProductFromDay}
                            onUpdateQuantity={updateDayItemQuantity}
                            orderItems={orderItems}
                            addProductToDay={addProductToDay}
                            products={products}
                          />
                        );
                      })}
                    </div>

                    {/* Summary */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        💡 <strong>Drag items between days</strong> to schedule daily production. 
                        Click items on the left to set total quantities first.
                      </p>
                    </div>
                  </div>
                </DndContext>
              )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || customerId === 0 || orderItems.size === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? (editingOrder ? "Updating..." : "Creating...") : (editingOrder ? "Update Order" : "Create Order")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Order Details Modal */}
      <AnimatePresence>
        {viewingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setViewingOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                  <button
                    onClick={() => setViewingOrder(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Customer</h3>
                  <p className="text-lg font-medium text-gray-900">{viewingOrder.customer.name}</p>
                  {viewingOrder.customer.contactName && (
                    <p className="text-sm text-gray-600">{viewingOrder.customer.contactName}</p>
                  )}
                  {viewingOrder.customer.email && (
                    <p className="text-sm text-gray-600">{viewingOrder.customer.email}</p>
                  )}
                  {viewingOrder.customer.phone && (
                    <p className="text-sm text-gray-600">{viewingOrder.customer.phone}</p>
                  )}
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Status</h3>
                    <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getStatusBgClass(getStatusColor(viewingOrder.status))}`}>
                      {ORDER_STATUSES.find(s => s.value === viewingOrder.status)?.label || viewingOrder.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Placed</h3>
                    <p className="text-gray-700">{format(new Date(viewingOrder.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  {viewingOrder.deliveryDate && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Delivery Date</h3>
                      <p className="text-gray-700">{format(new Date(viewingOrder.deliveryDate), "MMM d, yyyy")}</p>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Items Ordered</h3>
                  <div className="space-y-2">
                    {viewingOrder.items.map((item) => {
                      const batchesNeeded = Math.ceil(item.quantity / parseFloat(item.recipe.yieldQuantity));
                      return (
                        <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-900">{item.recipe.name}</p>
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                              {batchesNeeded} batch{batchesNeeded !== 1 ? 'es' : ''} needed
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Ordered:</span>
                              <span className="ml-2 font-semibold text-gray-900">{item.quantity} {item.recipe.yieldUnit}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Per batch:</span>
                              <span className="ml-2 text-gray-700">{item.recipe.yieldQuantity} {item.recipe.yieldUnit}</span>
                            </div>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-200">
                              📝 {item.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                {viewingOrder.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{viewingOrder.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

