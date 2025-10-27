"use client";

import { useState } from "react";
import { WholesaleCustomers } from "@/components/WholesaleCustomers";
import { WholesaleProducts } from "@/components/WholesaleProducts";
import { WholesaleOrders } from "@/components/WholesaleOrders";
import { SupplierManager } from "@/components/SupplierManager";
import { PurchaseOrdersPage } from "./purchase-orders/page";

interface WholesaleDashboardClientProps {
  customers: any[];
  products: any[];
  orders: any[];
  suppliers: any[];
  ingredients: any[];
  stats: {
    totalSuppliers: number;
    activeOrders: number;
    totalCustomers: number;
    revenueThisMonth: number;
  };
  companyId: number;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'suppliers', label: 'Suppliers', icon: '🏭' },
  { id: 'customers', label: 'Customers', icon: '👥' },
  { id: 'products', label: 'Products', icon: '📦' },
  { id: 'orders', label: 'Orders', icon: '📋' },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: '🛒' },
];

export function WholesaleDashboardClient({
  customers,
  products,
  orders,
  suppliers,
  ingredients,
  stats,
  companyId
}: WholesaleDashboardClientProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const StatCard = ({ title, value, icon, trend }: {
    title: string;
    value: string | number;
    icon: string;
    trend?: string;
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className="text-sm text-emerald-600 mt-1">{trend}</p>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Suppliers"
          value={stats.totalSuppliers}
          icon="🏭"
          trend="+2 this month"
        />
        <StatCard
          title="Active Orders"
          value={stats.activeOrders}
          icon="📋"
          trend="+5 this week"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon="👥"
          trend="+1 this month"
        />
        <StatCard
          title="Revenue This Month"
          value={`£${stats.revenueThisMonth.toLocaleString()}`}
          icon="💰"
          trend="+12% vs last month"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
            <span>📝</span>
            Create Purchase Order
          </button>
          <button className="bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2">
            <span>👥</span>
            Add New Customer
          </button>
          <button className="bg-cyan-600 text-white px-4 py-3 rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2">
            <span>📦</span>
            Add Product
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Order #{order.orderNumber || order.id} from {order.customer.name}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
        <div className="px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl">🏪</div>
            <h1 className="text-3xl font-bold">Wholesale Management</h1>
          </div>
          <p className="text-emerald-100">
            Manage suppliers, customers, products, and orders in one place
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'suppliers' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SupplierManager suppliers={suppliers} />
          </div>
        )}
        {activeTab === 'customers' && (
          <WholesaleCustomers customers={customers} companyId={companyId} />
        )}
        {activeTab === 'products' && (
          <WholesaleProducts 
            products={products} 
            recipes={[]} // Will be populated from parent
            companyId={companyId} 
          />
        )}
        {activeTab === 'orders' && (
          <WholesaleOrders 
            orders={orders} 
            customers={customers} 
            products={products} 
            companyId={companyId} 
          />
        )}
        {activeTab === 'purchase-orders' && (
          <PurchaseOrdersPage
            suppliers={suppliers}
            ingredients={ingredients}
            companyId={companyId}
          />
        )}
      </div>
    </div>
  );
}
