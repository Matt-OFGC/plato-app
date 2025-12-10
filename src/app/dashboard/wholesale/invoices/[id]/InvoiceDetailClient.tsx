"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { PaymentForm } from "@/components/PaymentForm";

interface Invoice {
  id: number;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  subtotal: string;
  taxAmount: string;
  total: string;
  paidAmount: string | null;
  status: string;
  notes: string | null;
  emailSent: boolean;
  customer: {
    id: number;
    name: string;
    email: string | null;
    outstandingBalance: string;
  };
  order: {
    id: number;
    orderNumber: string | null;
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
  } | null;
  WholesalePayment: Array<{
    id: number;
    amount: string;
    paymentDate: Date;
    paymentMethod: string;
    reference: string | null;
    User: {
      name: string | null;
    };
  }>;
  Company: {
    name: string;
  };
}

interface InvoiceDetailClientProps {
  invoice: Invoice;
  companyId: number;
}

export default function InvoiceDetailClient({ invoice, companyId }: InvoiceDetailClientProps) {
  const router = useRouter();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPDF, setShowPDF] = useState(false);

  const isOverdue = invoice.status !== "paid" && new Date(invoice.dueDate) < new Date();
  const remainingBalance = parseFloat(invoice.total) - (invoice.paidAmount ? parseFloat(invoice.paidAmount) : 0);

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

  async function sendEmail() {
    try {
      const res = await fetch(`/api/wholesale/invoices/${invoice.id}/send`, {
        method: "POST",
      });

      if (res.ok) {
        alert("Invoice email sent successfully");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send email");
      }
    } catch (error) {
      alert("Network error");
    }
  }

  function viewPDF() {
    window.open(`/api/wholesale/invoices/${invoice.id}/pdf`, "_blank");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Invoices
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
          <p className="text-gray-600 mt-1">
            {invoice.customer.name} • {format(new Date(invoice.issueDate), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(isOverdue ? "overdue" : invoice.status)}`}>
            {isOverdue ? "Overdue" : invoice.status}
          </span>
          <button
            onClick={viewPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View PDF
          </button>
          {!invoice.emailSent && invoice.customer.email && (
            <button
              onClick={sendEmail}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Send Email
            </button>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Bill To</h3>
            <div className="text-gray-900">
              <div className="font-semibold">{invoice.customer.name}</div>
              {invoice.customer.email && <div className="text-sm">{invoice.customer.email}</div>}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Invoice Details</h3>
            <div className="text-gray-900 space-y-1 text-sm">
              <div><strong>Issue Date:</strong> {format(new Date(invoice.issueDate), "MMM d, yyyy")}</div>
              <div><strong>Due Date:</strong> {format(new Date(invoice.dueDate), "MMM d, yyyy")}</div>
              {invoice.order && (
                <div><strong>Order:</strong> {invoice.order.orderNumber || `#${invoice.order.id}`}</div>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        {invoice.order && invoice.order.items.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Items</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.recipe.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity} {item.recipe.yieldUnit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="border-t pt-4">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">£{parseFloat(invoice.subtotal).toFixed(2)}</span>
              </div>
              {parseFloat(invoice.taxAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="text-gray-900">£{parseFloat(invoice.taxAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>£{parseFloat(invoice.total).toFixed(2)}</span>
              </div>
              {invoice.paidAmount && parseFloat(invoice.paidAmount) > 0 && (
                <>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Paid:</span>
                    <span>£{parseFloat(invoice.paidAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Remaining:</span>
                    <span>£{remainingBalance.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Payment History */}
        {invoice.WholesalePayment.length > 0 && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Payment History</h3>
            <div className="space-y-2">
              {invoice.WholesalePayment.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">£{parseFloat(payment.amount).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(payment.paymentDate), "MMM d, yyyy")} • {payment.paymentMethod}
                      {payment.reference && ` • Ref: ${payment.reference}`}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Recorded by {payment.User.name || "System"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {invoice.status !== "paid" && (
          <div className="mt-6 border-t pt-6">
            <button
              onClick={() => setShowPaymentForm(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Record Payment
            </button>
          </div>
        )}
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <PaymentForm
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          customerId={invoice.customer.id}
          companyId={companyId}
          remainingBalance={remainingBalance}
          onClose={() => {
            setShowPaymentForm(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

