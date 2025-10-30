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
      const data = await res.json();
      
      if (res.ok) {
        console.log("✅ Fetched users successfully:", data.users?.length || 0, "users");
        setUsers(data.users || []);
      } else {
        console.error("❌ Failed to fetch users:", data.error || "Unknown error");
        alert(`Failed to fetch users: ${data.error || "Unknown error"}`);
        setUsers([]);
      }
    } catch (error) {
      console.error("❌ Network error fetching users:", error);
      alert(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setUsers([]);
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

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        await fetchUsers(); // Refresh the list
        alert(`User ${userEmail} deleted successfully`);
        if (selectedUser?.id === userId) {
          setSelectedUser(null);
        }
      } else {
        const error = await res.json();
        alert(`Failed to delete user: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (userId: number, userEmail: string) => {
    const newPassword = prompt(`Enter new password for ${userEmail} (min 8 characters):`);
    if (!newPassword || newPassword.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      
      if (res.ok) {
        alert(`Password reset successfully for ${userEmail}`);
      } else {
        const error = await res.json();
        alert(`Failed to reset password: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to reset password:", error);
      alert("Failed to reset password");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = async (userId: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedUser(data.user);
      } else {
        alert("Failed to load user details");
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      alert("Failed to load user details");
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
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
          <p className="text-gray-600">Manage user accounts, subscriptions, and access levels</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
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
        {filteredUsers.length === 0 && !loading ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-2">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">No users found</p>
            <p className="text-sm text-gray-500 mt-1">
              {users.length === 0 
                ? "No users have been registered yet. Users will appear here after they sign up."
                : "No users match your current filters. Try adjusting your search or filters."}
            </p>
            {users.length === 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-400">
                  Total users in database: {users.length}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Companies</th>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.memberships && user.memberships.length > 0 ? (
                        <div className="space-y-1">
                          {user.memberships.slice(0, 2).map((m) => (
                            <div key={m.id} className="text-xs">
                              <span className="font-medium">{m.company.name}</span>
                              <span className="text-gray-500 ml-1">({m.role})</span>
                            </div>
                          ))}
                          {user.memberships.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{user.memberships.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No companies</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleViewDetails(user.id)}
                        disabled={actionLoading}
                        className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                        title="View Details"
                      >
                        View
                      </button>
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
                      <button
                        onClick={() => handleResetPassword(user.id, user.email)}
                        disabled={actionLoading}
                        className="px-3 py-1 text-xs rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        title="Reset Password"
                      >
                        Reset PW
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        disabled={actionLoading}
                        className="px-3 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                        title="Delete User"
                      >
                        Delete
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
        )}
      </div>

      <div className="text-sm text-gray-500">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-sm text-gray-900">{selectedUser.name || "Not set"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedUser.accountType === "demo" 
                      ? "bg-blue-100 text-blue-800" 
                      : "bg-green-100 text-green-800"
                  }`}>
                    {selectedUser.accountType === "demo" ? "Demo" : "Real"}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </span>
                    {selectedUser.isAdmin && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subscription</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedUser.subscriptionTier} - {selectedUser.subscriptionStatus}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-sm text-gray-900">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                  <p className="text-sm text-gray-900">{selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : "Never"}</p>
                </div>
              </div>

              {selectedUser.memberships && selectedUser.memberships.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Companies</label>
                  <div className="space-y-2">
                    {selectedUser.memberships.map((m) => (
                      <div key={m.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{m.company.name}</p>
                            <p className="text-sm text-gray-500">Role: {m.role} | Status: {m.isActive ? "Active" : "Inactive"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleResetPassword(selectedUser.id, selectedUser.email)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => handleDeleteUser(selectedUser.id, selectedUser.email)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Delete User
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="ml-auto px-4 py-2 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
