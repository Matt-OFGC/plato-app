"use client";

import { useState, useEffect } from "react";
import { PurchaseOrderForm } from "../components/PurchaseOrderForm";
import { PurchaseOrderList } from "../components/PurchaseOrderList";

interface Supplier {
  id: number;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface Ingredient {
  id: number;
  name: string;
  packQuantity: number;
  packUnit: string;
  packPrice: number;
  currency: string;
}

interface PurchaseOrder {
  id: number;
  orderNumber?: string | null;
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'INVOICED' | 'CANCELLED';
  expectedDelivery?: Date | null;
  receivedAt?: Date | null;
  invoicedAt?: Date | null;
  totalAmount?: number | null;
  notes?: string | null;
  createdAt: Date;
  supplier: {
    id: number;
    name: string;
    contactName?: string | null;
  };
  items: Array<{
    id: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    receivedQuantity?: number | null;
    notes?: string | null;
    ingredient: {
      id: number;
      name: string;
    };
  }>;
}

interface PurchaseOrdersPageProps {
  suppliers: Supplier[];
  ingredients: Ingredient[];
  companyId: number;
}

export function PurchaseOrdersPage({
  suppliers,
  ingredients,
  companyId
}: PurchaseOrdersPageProps) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);

  // Fetch purchase orders
  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/wholesale/purchase-orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.purchaseOrders);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSaveOrder = async (orderData: any) => {
    try {
      const url = editingOrder 
        ? `/api/wholesale/purchase-orders/${editingOrder.id}`
        : '/api/wholesale/purchase-orders';
      
      const method = editingOrder ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchOrders(); // Refresh the list
        setShowForm(false);
        setEditingOrder(null);
      } else {
        alert(data.error || 'Failed to save purchase order');
      }
    } catch (error) {
      console.error('Error saving purchase order:', error);
      alert('Failed to save purchase order');
    }
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) {
      return;
    }

    try {
      const response = await fetch(`/api/wholesale/purchase-orders/${orderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchOrders(); // Refresh the list
      } else {
        alert(data.error || 'Failed to delete purchase order');
      }
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      alert('Failed to delete purchase order');
    }
  };

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      const response = await fetch(`/api/wholesale/purchase-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchOrders(); // Refresh the list
        
        // Show success message based on status
        const statusMessages = {
          ORDERED: 'Purchase order marked as ordered',
          RECEIVED: 'Purchase order marked as received - inventory will be updated',
          INVOICED: 'Purchase order marked as invoiced',
        };
        
        if (statusMessages[status as keyof typeof statusMessages]) {
          alert(statusMessages[status as keyof typeof statusMessages]);
        }
      } else {
        alert(data.error || 'Failed to update purchase order status');
      }
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      alert('Failed to update purchase order status');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingOrder(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <PurchaseOrderForm
        suppliers={suppliers}
        ingredients={ingredients}
        onSave={handleSaveOrder}
        onCancel={handleCancelForm}
        initialData={editingOrder}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
          <p className="text-gray-600">Manage your supplier purchase orders</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          Create Purchase Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {orders.filter(o => o.status === 'ORDERED').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status === 'RECEIVED').length}
          </div>
          <div className="text-sm text-gray-600">Received</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-emerald-600">
            £{orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(0)}
          </div>
          <div className="text-sm text-gray-600">Total Value</div>
        </div>
      </div>

      {/* Orders List */}
      <PurchaseOrderList
        orders={orders}
        onEdit={handleEditOrder}
        onDelete={handleDeleteOrder}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
