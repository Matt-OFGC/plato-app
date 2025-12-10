"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customer: {
    id: number;
    name: string;
    email: string | null;
  };
  orderId: number | null;
  order: {
    id: number;
    orderNumber: string | null;
  } | null;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  taxAmount: string;
  total: string;
  paidAmount: string | null;
  status: string;
  emailSent: boolean;
}

interface InvoiceManagerProps {
  companyId: number;
  initialInvoices?: Invoice[];
}

export function InvoiceManager({ companyId, initialInvoices = [] }: InvoiceManagerProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, [filterStatus]);

  async function loadInvoices() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ companyId: companyId.toString() });
      if (filterStatus !== "all") {
        params.append("status", filterStatus);
      }
      const res = await fetch(`/api/wholesale/invoices?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Failed to load invoices:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function isOverdue(invoice: Invoice) {
    if (invoice.status === "paid") return false;
    return new Date(invoice.dueDate) < new Date();
  }

  async function markAsPaid(invoice: Invoice) {
    if (!confirm(`Mark invoice ${invoice.invoiceNumber} as paid?`)) return;

    try {
      const res = await fetch(`/api/wholesale/invoices/${invoice.id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: invoice.total,
          paymentMethod: "manual",
        }),
      });

      if (res.ok) {
        await loadInvoices();
        alert("Invoice marked as paid");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to mark invoice as paid");
      }
    } catch (error) {
      alert("Network error");
    }
  }

  async function sendEmail(invoice: Invoice) {
    try {
      const res = await fetch(`/api/wholesale/invoices/${invoice.id}/send`, {
        method: "POST",
      });

      if (res.ok) {
        await loadInvoices();
        alert("Invoice email sent");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send email");
      }
    } catch (error) {
      alert("Network error");
    }
  }

  function downloadPDF(invoice: Invoice) {
    window.open(`/api/wholesale/invoices/${invoice.id}/pdf`, "_blank");
  }

  const filteredInvoices = invoices.filter((inv) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "overdue") return isOverdue(inv);
    return inv.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Invoices</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading invoices...</div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No invoices found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className={isOverdue(invoice) ? "bg-red-50" : ""}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </div>
                    {invoice.order && (
                      <div className="text-xs text-gray-500">
                        Order: {invoice.order.orderNumber || `#${invoice.order.id}`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{invoice.customer.name}</div>
                    {invoice.customer.email && (
                      <div className="text-xs text-gray-500">{invoice.customer.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(invoice.issueDate), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isOverdue(invoice) ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                      {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      £{parseFloat(invoice.total).toFixed(2)}
                    </div>
                    {invoice.paidAmount && parseFloat(invoice.paidAmount) > 0 && (
                      <div className="text-xs text-gray-500">
                        Paid: £{parseFloat(invoice.paidAmount).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        isOverdue(invoice) ? "overdue" : invoice.status
                      )}`}
                    >
                      {isOverdue(invoice) ? "Overdue" : invoice.status}
                    </span>
                    {invoice.emailSent && (
                      <div className="text-xs text-gray-500 mt-1">Email sent</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => downloadPDF(invoice)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Download PDF"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      {!invoice.emailSent && (
                        <button
                          onClick={() => sendEmail(invoice)}
                          className="text-green-600 hover:text-green-900"
                          title="Send Email"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => window.location.href = `/dashboard/wholesale/invoices/${invoice.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {invoice.status !== "paid" && (
                        <button
                          onClick={() => markAsPaid(invoice)}
                          className="text-green-600 hover:text-green-900"
                          title="Mark as Paid"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
    </div>
  );
}

