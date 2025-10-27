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
  memberships?: Membership[];
  _count: {
    memberships: number;
  };
}

interface Membership {
  id: number;
  role: string;
  isActive: boolean;
  pin: string | null;
  company: {
    id: number;
    name: string;
  };
}

export function AdminUserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTestAccountsOnly, setShowTestAccountsOnly] = useState(false);
  const [hideTestAccounts, setHideTestAccounts] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [resetPasswordEmail, setResetPasswordEmail] = useState("");
  const [newPin, setNewPin] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
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
  }

  async function toggleUserStatus(userId: number, currentStatus: boolean) {
    try {
      const res = await fetch("/api/admin/users/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "User status updated" });
        fetchUsers();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to update user" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error" });
    }
  }

  async function toggleAdminStatus(userId: number, currentStatus: boolean) {
    try {
      const res = await fetch("/api/admin/users/toggle-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isAdmin: !currentStatus }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Admin status updated" });
        fetchUsers();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to update admin status" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error" });
    }
  }

  async function upgradeSubscription(userId: number, tier: string) {
    try {
      const res = await fetch("/api/admin/users/upgrade-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, tier }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: `Subscription upgraded to ${tier}` });
        fetchUsers();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to upgrade subscription" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error" });
    }
  }

  async function resetPassword(email: string) {
    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: `Password reset email sent to ${email}` });
        setResetPasswordEmail("");
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to reset password" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error" });
    }
  }

  async function updatePin(membershipId: number, pin: string) {
    try {
      const res = await fetch("/api/admin/team/update-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, pin }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "PIN updated successfully" });
        setNewPin("");
        fetchUsers();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to update PIN" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error" });
    }
  }

  // Function to determine if a user is a test/fake account
  const isTestAccount = (user: User) => {
    const testEmails = [
      'admin@testbakery.com',
      'demo@democafe.com',
      'admin@example.com'
    ];
    
    const testNames = [
      'Admin User',
      'Demo User',
      'Ronald O\'Hara',
      'Arnold Klocko',
      'Lucas Botsford',
      'Dr. Nancy Nader',
      'Cecil Aufderhar',
      'Suzanne Hilll',
      'Lena Wolff',
      'Sandy Schuppe',
      'Marsha Friesen',
      'Lillian Yundt'
    ];
    
    const testEmailPatterns = [
      /@test.*\.com$/,
      /@demo.*\.com$/,
      /@example\.com$/,
      /@gmail\.com$/,
      /@yahoo\.com$/
    ];
    
    // Check exact matches
    if (testEmails.includes(user.email)) return true;
    if (testNames.includes(user.name || '')) return true;
    
    // Check email patterns (but be more selective)
    if (testEmailPatterns.some(pattern => pattern.test(user.email))) {
      // Only mark as test if it's clearly a fake name or test email
      if (user.name && testNames.some(name => user.name?.includes(name.split(' ')[0]))) {
        return true;
      }
    }
    
    return false;
  };

  const filteredUsers = users.filter(user => {
    // Text search filter
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Test account filters
    const isTest = isTestAccount(user);
    
    if (showTestAccountsOnly) {
      return isTest;
    }
    
    if (hideTestAccounts) {
      return !isTest;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
        <p className="text-gray-600">Manage all user accounts and permissions</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === "success"
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
        }`}>
          {message.text}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        <div>
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        
        {/* Test Account Filters */}
        <div className="flex gap-4 items-center">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showTestAccountsOnly}
              onChange={(e) => {
                setShowTestAccountsOnly(e.target.checked);
                if (e.target.checked) setHideTestAccounts(false);
              }}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Show test accounts only</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={hideTestAccounts}
              onChange={(e) => {
                setHideTestAccounts(e.target.checked);
                if (e.target.checked) setShowTestAccountsOnly(false);
              }}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Hide test accounts</span>
          </label>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Companies
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <>
                    <tr key={user.id} className={!user.isActive ? "bg-gray-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || "No name"}
                            {user.isAdmin && (
                              <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                Admin
                              </span>
                            )}
                            {isTestAccount(user) && (
                              <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                Test Account
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          user.subscriptionTier === "professional" || user.subscriptionTier === "team" || user.subscriptionTier === "business"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {user.subscriptionTier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user._count.memberships}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                        >
                          {expandedUser === user.id ? "▲" : "▼"} Details
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id, user.isActive)}
                          className="text-indigo-600 hover:text-indigo-900 mr-2"
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => toggleAdminStatus(user.id, user.isAdmin)}
                          className="text-red-600 hover:text-red-900"
                        >
                          {user.isAdmin ? "Remove Admin" : "Make Admin"}
                        </button>
                      </td>
                    </tr>
                    {expandedUser === user.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-4">
                            {/* Subscription Management */}
                            <div className="border-b border-gray-200 pb-3">
                              <h4 className="font-semibold text-gray-900 mb-2">Subscription Management</h4>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => upgradeSubscription(user.id, "starter")}
                                  className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                >
                                  Starter
                                </button>
                                <button
                                  onClick={() => upgradeSubscription(user.id, "professional")}
                                  className="px-3 py-1 text-xs bg-blue-200 hover:bg-blue-300 rounded"
                                >
                                  Professional
                                </button>
                                <button
                                  onClick={() => upgradeSubscription(user.id, "team")}
                                  className="px-3 py-1 text-xs bg-purple-200 hover:bg-purple-300 rounded"
                                >
                                  Team
                                </button>
                                <button
                                  onClick={() => upgradeSubscription(user.id, "business")}
                                  className="px-3 py-1 text-xs bg-green-200 hover:bg-green-300 rounded"
                                >
                                  Business
                                </button>
                              </div>
                            </div>

                            {/* Password Reset */}
                            <div className="border-b border-gray-200 pb-3">
                              <h4 className="font-semibold text-gray-900 mb-2">Password Management</h4>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => resetPassword(user.email)}
                                  className="px-3 py-1 text-xs bg-orange-200 hover:bg-orange-300 rounded"
                                >
                                  Send Reset Link
                                </button>
                              </div>
                            </div>

                            {/* Company Memberships */}
                            {user.memberships && user.memberships.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Company Memberships</h4>
                                <div className="space-y-2">
                                  {user.memberships.map((membership) => (
                                    <div key={membership.id} className="bg-white p-3 rounded border border-gray-200">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-medium text-gray-900">{membership.company.name}</p>
                                          <p className="text-xs text-gray-600">Role: {membership.role}</p>
                                          {membership.pin && (
                                            <p className="text-xs text-gray-600">PIN: {membership.pin}</p>
                                          )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                          <input
                                            type="text"
                                            placeholder="New PIN (4-6 digits)"
                                            onChange={(e) => setNewPin(e.target.value)}
                                            className="px-2 py-1 text-xs border border-gray-300 rounded"
                                          />
                                          <button
                                            onClick={() => updatePin(membership.id, newPin)}
                                            className="px-3 py-1 text-xs bg-blue-200 hover:bg-blue-300 rounded"
                                          >
                                            Update PIN
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

