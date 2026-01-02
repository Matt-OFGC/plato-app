"use client";

import { useState } from "react";
import { format } from "date-fns";

type InvoiceWithRelations = {
  id: number;
  invoiceNumber: string | null;
  issueDate: string | null;
  dueDate: string | null;
  status: string;
  total: any;
  currency: string;
  notes: string | null;
  paymentTerms?: string | null;
  purchaseOrderNumber?: string | null;
  paidDate?: string | null;
  paidAmount?: any;
  customer?: {
    name: string;
    address?: string | null;
    city?: string | null;
    postcode?: string | null;
    purchaseOrderNumber?: string | null;
  } | null;
  company?: {
    name: string;
    address?: string | null;
    city?: string | null;
    postcode?: string | null;
    invoicingBankName?: string | null;
    invoicingBankAccount?: string | null;
    invoicingSortCode?: string | null;
    invoicingInstructions?: string | null;
  } | null;
  order?: {
    id: number;
    orderNumber: string | null;
    deliveryDate: string | null;
    items?: Array<{
      id: number;
      quantity: number;
      notes: string | null;
      recipe?: { name: string | null; yieldUnit?: string | null };
    }>;
  } | null;
};

interface InvoiceDetailClientProps {
  invoice: InvoiceWithRelations;
}

export function InvoiceDetailClient({ invoice }: InvoiceDetailClientProps) {
  const [paymentTerms, setPaymentTerms] = useState(invoice.paymentTerms || "");
  const [dueDate, setDueDate] = useState(invoice.dueDate ? invoice.dueDate.slice(0, 10) : "");
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState(invoice.purchaseOrderNumber || invoice.customer?.purchaseOrderNumber || "");
  const [notes, setNotes] = useState(invoice.notes || "");
  const [status, setStatus] = useState(invoice.status || "sent");
  const [saving, setSaving] = useState(false);

  const formattedIssueDate = invoice.issueDate ? format(new Date(invoice.issueDate), "MMM d, yyyy") : "—";
  const formattedDueDate = dueDate ? format(new Date(dueDate), "MMM d, yyyy") : "—";

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/wholesale/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentTerms: paymentTerms || null,
          dueDate: dueDate || null,
          purchaseOrderNumber: purchaseOrderNumber || null,
          notes: notes || null,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update invoice");
      }
      alert("Invoice updated");
    } catch (error: any) {
      alert(error?.message || "Failed to update invoice");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Invoice {invoice.invoiceNumber || `#${invoice.id}`}
          </h1>
          <p className="text-gray-600 mt-1">
            {invoice.customer?.name || "Customer"} • Issued {formattedIssueDate}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="overdue">Overdue</option>
            <option value="paid">Paid</option>
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Invoice + Billing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">From</p>
              <p className="font-semibold text-gray-900">{invoice.company?.name}</p>
              {invoice.company?.address && (
                <p className="text-sm text-gray-600">{invoice.company.address}</p>
              )}
              {(invoice.company?.city || invoice.company?.postcode) && (
                <p className="text-sm text-gray-600">
                  {[invoice.company.city, invoice.company.postcode].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">To</p>
              <p className="font-semibold text-gray-900">{invoice.customer?.name}</p>
              {invoice.customer?.address && (
                <p className="text-sm text-gray-600">{invoice.customer.address}</p>
              )}
              {(invoice.customer?.city || invoice.customer?.postcode) && (
                <p className="text-sm text-gray-600">
                  {[invoice.customer.city, invoice.customer.postcode].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Issue Date</p>
              <p className="font-semibold text-gray-900">{formattedIssueDate}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Due Date</p>
              <p className="font-semibold text-gray-900">{formattedDueDate}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Payment Terms</p>
              <p className="font-semibold text-gray-900">{paymentTerms || "—"}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">Purchase Order</p>
              <p className="font-semibold text-gray-900">{purchaseOrderNumber || "—"}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Items</h3>
            {invoice.order?.items && invoice.order.items.length > 0 ? (
              <div className="space-y-2">
                {invoice.order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{item.recipe?.name || "Item"}</p>
                      {item.notes && <p className="text-gray-500 text-xs">{item.notes}</p>}
                    </div>
                    <p className="font-semibold text-gray-900">
                      {item.quantity} {item.recipe?.yieldUnit || ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No line items recorded for this invoice.</p>
            )}
          </div>
        </div>

        {/* Editable fields */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Terms
            </label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Order Number
            </label>
            <input
              type="text"
              value={purchaseOrderNumber}
              onChange={(e) => setPurchaseOrderNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Payment Details</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <p>Bank: {invoice.company?.invoicingBankName || "—"}</p>
              <p>Account: {invoice.company?.invoicingBankAccount || "—"}</p>
              <p>Sort Code: {invoice.company?.invoicingSortCode || "—"}</p>
              {invoice.company?.invoicingInstructions && (
                <p className="text-gray-600 mt-2">{invoice.company.invoicingInstructions}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

