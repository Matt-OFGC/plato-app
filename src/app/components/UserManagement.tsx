"use client";

import { useState, useEffect } from "react";

interface User {
  id: number;
  email: string;
  name: string | null;
  isAdmin: boolean;
  isActive: boolean;
  subscriptionTier: string;
  subscriptionStatus: string;
  createdAt: string;
  lastLoginAt: string | null;
  accountType?: "demo" | "real";
  memberships?: Array<{
    id: number;
    role: string;
    isActive: boolean;
    company: {
      id: number;
      name: string;
    };
  }>;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "demo" | "real">("all");
  const [filterTier, setFilterTier] = useState<"all" | "starter" | "professional" | "team" | "business">("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users?includeMemberships=true");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: number, isActive: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive }),
      });
      
      if (res.ok) {
        await fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to toggle user status:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: number, isAdmin: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users/toggle-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isAdmin }),
      });
      
      if (res.ok) {
        await fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to toggle admin status:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgradeSubscription = async (userEmail: string, tier: string, isLifetime: boolean = false) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users/upgrade-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail, tier, isLifetime }),
      });
      
      if (res.ok) {
        await fetchUsers(); // Refresh the list
        alert(`Successfully upgraded ${userEmail} to ${tier}${isLifetime ? " (lifetime)" : ""}`);
      } else {
        const error = await res.json();
        alert(`Failed to upgrade: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to upgrade subscription:", error);
      alert("Failed to upgrade subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === "all" || 
                       (filterType === "demo" && user.accountType === "demo") ||
                       (filterType === "real" && user.accountType === "real");
    
    const matchesTier = filterTier === "all" || user.subscriptionTier === filterTier;
    
    return matchesSearch && matchesType && matchesTier;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
        <p className="text-gray-600">Manage user accounts, subscriptions, and access levels</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Accounts</option>
              <option value="demo">Demo Accounts</option>
              <option value="real">Real Accounts</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Tier</label>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Tiers</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="team">Team</option>
              <option value="business">Business</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.name || "No name"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.accountType === "demo" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {user.accountType === "demo" ? "Demo" : "Real"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 capitalize">{user.subscriptionTier}</div>
                      <div className="text-sm text-gray-500">{user.subscriptionStatus}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                      {user.isAdmin && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleActive(user.id, !user.isActive)}
                        disabled={actionLoading}
                        className={`px-3 py-1 text-xs rounded ${
                          user.isActive 
                            ? "bg-red-100 text-red-700 hover:bg-red-200" 
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleToggleAdmin(user.id, !user.isAdmin)}
                        disabled={actionLoading}
                        className="px-3 py-1 text-xs rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                      >
                        {user.isAdmin ? "Remove Admin" : "Make Admin"}
                      </button>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            const [tier, isLifetime] = e.target.value.split(":");
                            handleUpgradeSubscription(user.email, tier, isLifetime === "true");
                            e.target.value = ""; // Reset selection
                          }
                        }}
                        disabled={actionLoading}
                        className="px-2 py-1 text-xs border border-gray-300 rounded"
                      >
                        <option value="">Upgrade...</option>
                        <option value="professional:false">Professional (1 year)</option>
                        <option value="team:false">Team (1 year)</option>
                        <option value="business:false">Business (1 year)</option>
                        <option value="professional:true">Professional (Lifetime)</option>
                        <option value="team:true">Team (Lifetime)</option>
                        <option value="business:true">Business (Lifetime)</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
}
