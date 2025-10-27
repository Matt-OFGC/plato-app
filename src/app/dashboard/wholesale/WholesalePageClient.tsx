"use client";

import { useState } from "react";
import SuppliersOverview from "./components/SuppliersOverview";
import OrderManagement from "./components/OrderManagement";
import PriceTracking from "./components/PriceTracking";
import InventorySync from "./components/InventorySync";

interface Supplier {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

interface WholesalePageClientProps {
  companyId: number;
  currentUserRole: string;
  suppliers: Supplier[];
}

export default function WholesalePageClient({
  companyId,
  currentUserRole,
  suppliers,
}: WholesalePageClientProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const canManageAll = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  const tabs: Array<{ id: string; label: string; icon?: string }> = [
    { id: "overview", label: "Overview" },
    { id: "suppliers", label: "Suppliers", icon: "🏢" },
    { id: "orders", label: "Orders", icon: "📋" },
    { id: "pricing", label: "Price Tracking", icon: "💰" },
    { id: "inventory", label: "Inventory Sync", icon: "📊" },
  ];

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Wholesale Management</h1>
        <p className="text-green-100">Manage suppliers, orders, and inventory</p>
      </div>

      {/* Tab Navigation - Modern Style */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <nav className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200
                ${
                  activeTab === tab.id
                    ? "bg-green-600 text-white shadow-md transform scale-105"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
            >
              {tab.icon && <span className="mr-1">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <SuppliersOverview
            companyId={companyId}
            canManageAll={canManageAll}
            suppliers={suppliers}
          />
        )}

        {activeTab === "suppliers" && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Supplier Management</h3>
            <p className="text-gray-600">Coming soon - Manage your supplier database</p>
          </div>
        )}

        {activeTab === "orders" && (
          <OrderManagement
            companyId={companyId}
            canManageAll={canManageAll}
          />
        )}

        {activeTab === "pricing" && (
          <PriceTracking
            companyId={companyId}
          />
        )}

        {activeTab === "inventory" && (
          <InventorySync
            companyId={companyId}
          />
        )}
      </div>
    </div>
  );
}
