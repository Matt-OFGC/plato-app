"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

interface DeliveryNote {
  id: number;
  deliveryNoteNumber: string;
  orderId: number;
  customerId: number;
  deliveryDate: Date;
  deliveredBy: string | null;
  notes: string | null;
  emailSent: boolean;
  customer: {
    id: number;
    name: string;
    email: string | null;
  };
  order: {
    id: number;
    orderNumber: string | null;
  };
}

interface DeliveryNoteManagerProps {
  companyId: number;
  orderId?: number;
  initialNotes?: DeliveryNote[];
}

export function DeliveryNoteManager({ companyId, orderId, initialNotes = [] }: DeliveryNoteManagerProps) {
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>(initialNotes);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [selectedOrderId, setSelectedOrderId] = useState<number>(orderId || 0);
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [deliveredBy, setDeliveredBy] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!orderId) {
      loadDeliveryNotes();
    }
  }, [orderId]);

  async function loadDeliveryNotes() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ companyId: companyId.toString() });
      if (orderId) {
        params.append("orderId", orderId.toString());
      }
      const res = await fetch(`/api/wholesale/delivery-notes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDeliveryNotes(data);
      }
    } catch (error) {
      console.error("Failed to load delivery notes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!selectedOrderId) {
      alert("Please select an order");
      return;
    }

    setSaving(true);
    try {
      // Get order to get customer ID
      const orderRes = await fetch(`/api/wholesale/orders/${selectedOrderId}`);
      if (!orderRes.ok) {
        throw new Error("Failed to fetch order");
      }
      const order = await orderRes.json();

      const res = await fetch("/api/wholesale/delivery-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrderId,
          customerId: order.customerId,
          companyId,
          deliveryDate,
          deliveredBy: deliveredBy || null,
          notes: notes || null,
        }),
      });

      if (res.ok) {
        const newNote = await res.json();
        setDeliveryNotes([newNote, ...deliveryNotes]);
        setShowCreateModal(false);
        setSelectedOrderId(0);
        setDeliveryDate(format(new Date(), "yyyy-MM-dd"));
        setDeliveredBy("");
        setNotes("");
        alert("Delivery note created successfully");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create delivery note");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  }

  function downloadPDF(note: DeliveryNote) {
    window.open(`/api/wholesale/delivery-notes/${note.id}/pdf`, "_blank");
  }

  async function sendEmail(note: DeliveryNote) {
    try {
      const res = await fetch(`/api/wholesale/delivery-notes/${note.id}/send`, {
        method: "POST",
      });

      if (res.ok) {
        await loadDeliveryNotes();
        alert("Delivery note email sent");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send email");
      }
    } catch (error) {
      alert("Network error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Delivery Notes</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Create Delivery Note
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading delivery notes...</div>
        </div>
      ) : deliveryNotes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No delivery notes found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Note #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivered By
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deliveryNotes.map((note) => (
                <tr key={note.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {note.deliveryNoteNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {note.order.orderNumber || `Order #${note.order.id}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{note.customer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(note.deliveryDate), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {note.deliveredBy || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => downloadPDF(note)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Download PDF"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      {!note.emailSent && note.customer.email && (
                        <button
                          onClick={() => sendEmail(note)}
                          className="text-green-600 hover:text-green-900"
                          title="Send Email"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create Delivery Note</h3>
            
            <div className="space-y-4">
              {!orderId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order ID
                  </label>
                  <input
                    type="number"
                    value={selectedOrderId || ""}
                    onChange={(e) => setSelectedOrderId(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Enter order ID"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivered By
                </label>
                <input
                  type="text"
                  value={deliveredBy}
                  onChange={(e) => setDeliveredBy(e.target.value)}
                  placeholder="Driver name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Delivery notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedOrderId(0);
                  setDeliveryDate(format(new Date(), "yyyy-MM-dd"));
                  setDeliveredBy("");
                  setNotes("");
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !selectedOrderId}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

