"use client";

import { useState } from "react";

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

interface PurchaseOrderListProps {
  orders: PurchaseOrder[];
  onEdit: (order: PurchaseOrder) => void;
  onDelete: (orderId: number) => void;
  onStatusChange: (orderId: number, status: string) => void;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ORDERED: 'bg-blue-100 text-blue-800',
  RECEIVED: 'bg-green-100 text-green-800',
  INVOICED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels = {
  DRAFT: 'Draft',
  ORDERED: 'Ordered',
  RECEIVED: 'Received',
  INVOICED: 'Invoiced',
  CANCELLED: 'Cancelled',
};

export function PurchaseOrderList({
  orders,
  onEdit,
  onDelete,
  onStatusChange
}: PurchaseOrderListProps) {
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: Date | null | undefined) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchase Orders</h3>
          <p className="text-gray-600">Create your first purchase order to get started.</p>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Order Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {order.orderNumber || `PO-${order.id}`}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {order.supplier.name}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">
                    £{order.totalAmount?.toFixed(2) || '0.00'}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="text-emerald-600 hover:text-emerald-700 text-sm"
                    >
                      {expandedOrder === order.id ? 'Hide' : 'View'} Details
                    </button>
                    <button
                      onClick={() => onEdit(order)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    {order.status === 'DRAFT' && (
                      <button
                        onClick={() => onDelete(order.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Meta */}
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Created:</span> {formatDate(order.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Expected:</span> {formatDate(order.expectedDelivery)}
                </div>
                <div>
                  <span className="font-medium">Received:</span> {formatDate(order.receivedAt)}
                </div>
                <div>
                  <span className="font-medium">Invoiced:</span> {formatDate(order.invoicedAt)}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedOrder === order.id && (
              <div className="p-4 bg-gray-50">
                {/* Status Actions */}
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Update Status</h5>
                  <div className="flex gap-2">
                    {order.status === 'DRAFT' && (
                      <button
                        onClick={() => onStatusChange(order.id, 'ORDERED')}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Mark as Ordered
                      </button>
                    )}
                    {order.status === 'ORDERED' && (
                      <button
                        onClick={() => onStatusChange(order.id, 'RECEIVED')}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Mark as Received
                      </button>
                    )}
                    {order.status === 'RECEIVED' && (
                      <button
                        onClick={() => onStatusChange(order.id, 'INVOICED')}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                      >
                        Mark as Invoiced
                      </button>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Order Items</h5>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex-1">
                          <span className="font-medium">{item.ingredient.name}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            {item.quantity} × £{item.unitPrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">£{item.totalPrice.toFixed(2)}</div>
                          {item.receivedQuantity && (
                            <div className="text-sm text-gray-600">
                              Received: {item.receivedQuantity}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-900 mb-2">Notes</h5>
                    <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
