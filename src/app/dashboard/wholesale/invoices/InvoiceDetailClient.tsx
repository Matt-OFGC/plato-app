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
  taxRate?: any;
  taxAmount?: any;
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
      price?: any;
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
  const [downloading, setDownloading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const formattedIssueDate = invoice.issueDate ? format(new Date(invoice.issueDate), "MMM d, yyyy") : "—";
  const formattedDueDate = dueDate ? format(new Date(dueDate), "MMM d, yyyy") : "—";

  const currencySymbol = invoice.currency === "USD" ? "$" : invoice.currency === "EUR" ? "€" : "£";
  const total = Number(invoice.total || 0);
  const paidAmount = Number(invoice.paidAmount || 0);
  const outstanding = Math.max(total - paidAmount, 0);
  const taxRate = invoice.taxRate ? Number(invoice.taxRate) : 0;
  const taxAmount = invoice.taxAmount ? Number(invoice.taxAmount) : 0;
  const subtotal = Math.max(total - taxAmount, 0);
  const customerEmail = invoice.customer?.email || null;
  const customerName = invoice.customer?.name || "Customer";
  const issueDateForName = invoice.issueDate ? format(new Date(invoice.issueDate), "yyyy-MM-dd") : "undated";
  const baseInvoiceLabel = invoice.invoiceNumber || `INV-${invoice.id}`;
  const invoiceShortLabel = (() => {
    if (invoice.invoiceNumber) {
      const match = /INV-?(\d+)/i.exec(invoice.invoiceNumber);
      if (match?.[1]) return `INV ${match[1]}`;
    }
    return baseInvoiceLabel.replace(/-/g, " ");
  })();
  const safeCustomerSlug = customerName.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "customer";
  const downloadName = `${safeCustomerSlug}-${invoiceShortLabel.replace(/\s+/g, "-").toLowerCase()}-${issueDateForName}.pdf`;

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/wholesale/invoices/${invoice.id}/pdf`);
      if (!res.ok) throw new Error("Failed to download PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error?.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  async function handleSendEmail() {
    if (!customerEmail) {
      alert("No customer email on file. Please add an email to send.");
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/wholesale/invoices/${invoice.id}/send`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send invoice");
      }
      alert("Invoice sent to customer");
    } catch (error: any) {
      alert(error?.message || "Failed to send invoice");
    } finally {
      setSendingEmail(false);
    }
  }

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
            {customerName} — {invoiceShortLabel} — {issueDateForName}
          </h1>
          <p className="text-gray-600 mt-1">
            Issued {formattedIssueDate}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Download name: {downloadName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-gray-600">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`px-3 py-[6px] text-sm rounded-xl border backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-indigo-500 transition ${
                status === "paid"
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-700"
                  : status === "overdue"
                  ? "bg-red-50/70 border-red-200 text-red-700"
                  : status === "sent"
                  ? "bg-blue-50/70 border-blue-200 text-blue-700"
                  : "bg-gray-50/70 border-gray-200 text-gray-700"
              }`}
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-[9px] text-sm rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm hover:from-indigo-500/90 hover:to-indigo-600/90 disabled:opacity-60 transition"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-3 py-[9px] text-sm rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm shadow-sm hover:bg-white disabled:opacity-60 transition"
          >
            {downloading ? "Downloading…" : "Download PDF"}
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-[9px] text-sm rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm shadow-sm hover:bg-white transition"
          >
            Print
          </button>
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail || !customerEmail}
            className="px-3 py-[9px] text-sm rounded-xl border border-indigo-100 bg-indigo-50/60 text-indigo-700 shadow-sm hover:bg-indigo-50 disabled:opacity-50 transition"
            title={customerEmail ? "Send invoice by email" : "Add a customer email to send"}
          >
            {sendingEmail ? "Sending…" : customerEmail ? "Send Email" : "No Email"}
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
              <div className="space-y-3">
                {invoice.order.items.map((item) => {
                  const unitPrice = item.price != null ? Number(item.price) : null;
                  const lineTotal = unitPrice != null ? unitPrice * Number(item.quantity || 0) : null;
                  return (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{item.recipe?.name || "Item"}</p>
                        <div className="text-xs text-gray-600">
                          Qty: {item.quantity} {item.recipe?.yieldUnit || ""}
                          {unitPrice != null && (
                            <> • Unit: {currencySymbol}{unitPrice.toFixed(2)}</>
                          )}
                        </div>
                        {item.notes && <p className="text-gray-500 text-xs">{item.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {lineTotal != null ? `${currencySymbol}${lineTotal.toFixed(2)}` : "—"}
                        </p>
                        {unitPrice == null && (
                          <p className="text-[11px] text-gray-400">No price</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No line items recorded for this invoice.</p>
            )}
          </div>
        </div>

        {/* Editable fields */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Totals</p>
                <span className="text-xs text-gray-500">All prices in {invoice.currency || "GBP"}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-700">
                <span>Subtotal</span>
                <span className="font-semibold">{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-700">
                <span>Tax {taxRate ? `(${taxRate}%)` : ""}</span>
                <span className="font-semibold">{currencySymbol}{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-3">
                <span>Total</span>
                <span>{currencySymbol}{total.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-700">
                <span>Paid</span>
                <span className="font-semibold">{currencySymbol}{paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-bold">
                <span className={outstanding > 0 ? "text-red-600" : "text-emerald-700"}>
                  Outstanding
                </span>
                <span className={outstanding > 0 ? "text-red-600" : "text-emerald-700"}>
                  {currencySymbol}{outstanding.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3">
              <p className="text-sm font-semibold text-gray-900">Billing Notes</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <input
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 30 Days"
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
                    value={purchaseOrderNumber}
                    onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="PO-12345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    rows={4}
                    placeholder="Add any special instructions, reference numbers, or delivery notes..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
            <p className="text-sm font-semibold text-gray-900">Payment Details</p>
            <p className="text-sm text-gray-700">Bank: {invoice.company?.invoicingBankName || "—"}</p>
            <p className="text-sm text-gray-700">Account: {invoice.company?.invoicingBankAccount || "—"}</p>
            <p className="text-sm text-gray-700">Sort Code: {invoice.company?.invoicingSortCode || "—"}</p>
            {invoice.company?.invoicingInstructions && (
              <p className="text-sm text-gray-700">Instructions: {invoice.company.invoicingInstructions}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
