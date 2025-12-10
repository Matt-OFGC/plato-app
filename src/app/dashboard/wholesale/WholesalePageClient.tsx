"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface Customer {
  id: number;
  name: string;
  outstandingBalance?: string;
  totalValue?: string;
  totalPaid?: string;
  _count: {
    orders: number;
    productionItems: number;
  };
}

interface Order {
  id: number;
  orderNumber: string | null;
  deliveryDate: Date | null;
  status: string;
  customer: {
    id: number;
    name: string;
  };
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  total: string;
  status: string;
  dueDate: Date;
  customer: {
    id: number;
    name: string;
  };
}

interface WholesalePageClientProps {
  companyId: number;
  currentUserRole: string;
  customers: Customer[];
  recentOrders: Order[];
  recentInvoices: Invoice[];
  totalOutstanding: string;
  overdueCount: number;
}

export default function WholesalePageClient({
  companyId,
  currentUserRole,
  customers,
  recentOrders,
  recentInvoices,
  totalOutstanding,
  overdueCount,
}: WholesalePageClientProps) {
  const router = useRouter();

  const canManageAll = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const activeCustomers = customers.filter(c => c.isActive);
  const pendingOrders = recentOrders.filter(o => o.status === "pending" || o.status === "confirmed");

  return (
    <div className="space-y-6">
      {/* Overview Content */}
      <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Active Customers</div>
                <div className="text-3xl font-bold text-gray-900">{activeCustomers.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Pending Orders</div>
                <div className="text-3xl font-bold text-gray-900">{pendingOrders.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Outstanding Balance</div>
                <div className="text-3xl font-bold text-gray-900">£{parseFloat(totalOutstanding).toFixed(2)}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Overdue Invoices</div>
                <div className={`text-3xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {overdueCount}
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                <button
                  onClick={() => router.push("/dashboard/wholesale/orders")}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  View All →
                </button>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent orders</p>
              ) : (
                <div className="space-y-2">
                  {recentOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{order.customer.name}</div>
                        <div className="text-sm text-gray-500">
                          {order.orderNumber || `Order #${order.id}`} • {order.deliveryDate ? format(new Date(order.deliveryDate), "MMM d, yyyy") : "No date"}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        order.status === "confirmed" ? "bg-blue-100 text-blue-800" :
                        order.status === "delivered" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Invoices */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Recent Invoices</h2>
                <button
                  onClick={() => router.push("/dashboard/wholesale/invoices")}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  View All →
                </button>
              </div>
              {recentInvoices.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent invoices</p>
              ) : (
                <div className="space-y-2">
                  {recentInvoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                        <div className="text-sm text-gray-500">
                          {invoice.customer.name} • Due {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">£{parseFloat(invoice.total).toFixed(2)}</div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === "paid" ? "bg-green-100 text-green-800" :
                          invoice.status === "overdue" ? "bg-red-100 text-red-800" :
                          invoice.status === "sent" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push("/dashboard/wholesale")}
                className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-green-500 transition-colors text-left"
              >
                <div className="text-2xl mb-2">👥</div>
                <div className="font-semibold text-gray-900 mb-1">Manage Customers</div>
                <div className="text-sm text-gray-600">Add or edit wholesale customers</div>
              </button>
              <button
                onClick={() => router.push("/dashboard/wholesale/orders")}
                className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-green-500 transition-colors text-left"
              >
                <div className="text-2xl mb-2">📋</div>
                <div className="font-semibold text-gray-900 mb-1">Create Order</div>
                <div className="text-sm text-gray-600">Add a new wholesale order</div>
              </button>
              <button
                onClick={() => router.push("/dashboard/wholesale/invoices")}
                className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:border-green-500 transition-colors text-left"
              >
                <div className="text-2xl mb-2">🧾</div>
                <div className="font-semibold text-gray-900 mb-1">View Invoices</div>
                <div className="text-sm text-gray-600">Manage invoices and payments</div>
              </button>
            </div>
          </div>
    </div>
  );
}
