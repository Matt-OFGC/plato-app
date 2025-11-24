"use client";

import { useState, useEffect } from "react";

interface Company {
  id: number;
  name: string;
  slug: string;
  businessType: string | null;
  country: string;
  createdAt: string;
  maxSeats: number;
  seatsUsed: number;
  isActive: boolean;
  memberships: Array<{
    id: number;
    role: string;
    isActive: boolean;
    pin: string | null;
    createdAt: string;
    user: {
      id: number;
      email: string;
      name: string | null;
      isActive: boolean;
      createdAt: string;
      lastLoginAt: string | null;
    };
  }>;
  _count: {
    recipes: number;
    ingredients: number;
    memberships: number;
  };
}

export function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("EMPLOYEE");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/admin/companies");
      const data = await res.json();
      
      if (res.ok) {
        console.log("✅ Fetched companies successfully:", data.companies?.length || 0, "companies");
        console.log("Companies data:", data.companies);
        setCompanies(data.companies || []);
      } else {
        const errorMsg = data.details || data.error || "Unknown error";
        console.error("❌ Failed to fetch companies:", errorMsg);
        console.error("Full error response:", data);
        alert(`Failed to fetch companies: ${errorMsg}\n\nCheck browser console for details.`);
        setCompanies([]);
      }
    } catch (error) {
      console.error("❌ Network error fetching companies:", error);
      alert(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyDetails = async (companyId: number) => {
    try {
      setActionLoading(true);
      console.log("Fetching company details for ID:", companyId);
      const res = await fetch(`/api/admin/companies/${companyId}`);
      const data = await res.json();
      
      console.log("API Response:", { status: res.status, ok: res.ok, data });
      
      if (res.ok) {
        if (data.company) {
          console.log("✅ Company details fetched:", data.company);
          setSelectedCompany(data.company);
        } else {
          console.error("❌ No company data in response:", data);
          alert(`Failed to load company details: No company data returned`);
        }
      } else {
        console.error("❌ Failed to fetch company details:", data);
        const errorMsg = data.details || data.error || "Unknown error";
        alert(`Failed to load company details: ${errorMsg}\n\nStatus: ${res.status}\n\nCheck browser console for details.`);
      }
    } catch (error) {
      console.error("❌ Network error fetching company details:", error);
      alert(`Network error: ${error instanceof Error ? error.message : "Unknown error"}\n\nCheck browser console for details.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewCompany = async (companyId: number) => {
    console.log("View company clicked:", companyId);
    await fetchCompanyDetails(companyId);
  };

  const handleResetPIN = async (membershipId: number, userEmail: string) => {
    const newPin = prompt(`Enter new PIN for ${userEmail} (4-6 digits):`);
    if (!newPin || !/^\d{4,6}$/.test(newPin)) {
      alert("PIN must be 4-6 digits");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/memberships/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: newPin }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`PIN reset successfully! New PIN: ${data.pin}`);
        if (selectedCompany) {
          await fetchCompanyDetails(selectedCompany.id);
        }
      } else {
        const error = await res.json();
        alert(`Failed to reset PIN: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to reset PIN:", error);
      alert("Failed to reset PIN");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePIN = async (membershipId: number) => {
    if (!confirm("Remove PIN from this user?")) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/memberships/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: null }),
      });

      if (res.ok) {
        alert("PIN removed successfully");
        if (selectedCompany) {
          await fetchCompanyDetails(selectedCompany.id);
        }
      } else {
        const error = await res.json();
        alert(`Failed to remove PIN: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to remove PIN:", error);
      alert("Failed to remove PIN");
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
        alert("Password reset successfully");
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

  const handleChangeRole = async (membershipId: number, newRole: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/memberships/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        alert("Role updated successfully");
        if (selectedCompany) {
          await fetchCompanyDetails(selectedCompany.id);
        }
      } else {
        const error = await res.json();
        alert(`Failed to update role: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Failed to update role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (membershipId: number, userName: string) => {
    if (!confirm(`Remove ${userName} from this company?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/memberships/${membershipId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("User removed from company successfully");
        if (selectedCompany) {
          await fetchCompanyDetails(selectedCompany.id);
        }
        await fetchCompanies(); // Refresh company list
      } else {
        const error = await res.json();
        alert(`Failed to remove user: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to remove user:", error);
      alert("Failed to remove user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedCompany || !newMemberEmail) {
      alert("Email is required");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/companies/${selectedCompany.id}/add-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newMemberEmail,
          name: newMemberName || undefined,
          role: newMemberRole,
        }),
      });

      if (res.ok) {
        alert("User added to company successfully");
        setShowAddMember(false);
        setNewMemberEmail("");
        setNewMemberName("");
        setNewMemberRole("VIEWER");
        if (selectedCompany) {
          await fetchCompanyDetails(selectedCompany.id);
        }
        await fetchCompanies();
      } else {
        const error = await res.json();
        alert(`Failed to add user: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to add user:", error);
      alert("Failed to add user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMemberStatus = async (membershipId: number, isActive: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/memberships/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        if (selectedCompany) {
          await fetchCompanyDetails(selectedCompany.id);
        }
      } else {
        const error = await res.json();
        alert(`Failed to update status: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Management</h2>
          <p className="text-gray-600">Manage companies and their team members</p>
        </div>
        <button
          onClick={fetchCompanies}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <input
          type="text"
          placeholder="Search companies by name or slug..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Companies List */}
      {companies.length === 0 && !loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-gray-500 mb-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900">No companies found</p>
          <p className="text-sm text-gray-500 mt-1">
            No companies have been registered yet. Companies will appear here after users sign up.
          </p>
          <div className="mt-4">
            <p className="text-xs text-gray-400">
              Total companies in database: {companies.length}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Check browser console for debugging information.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <tr 
                  key={company.id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleViewCompany(company.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{company.name}</div>
                      <div className="text-sm text-gray-500">{company.slug}</div>
                      {company.businessType && (
                        <div className="text-xs text-gray-400 mt-1">{company.businessType}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">
                      {company._count.memberships}
                    </div>
                    <div className="text-xs text-gray-500">
                      / {company.maxSeats || "∞"} seats
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company._count.recipes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company._count.ingredients}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCompany(company.id);
                        }}
                        disabled={actionLoading}
                        className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        View Team
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCompany(company.id);
                        }}
                        className="px-3 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        title="View Details"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Loading State */}
      {actionLoading && !selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading company details...</p>
          </div>
        </div>
      )}

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedCompany(null);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedCompany.name}</h3>
                <p className="text-sm text-gray-500">{selectedCompany.slug}</p>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Company Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                  <p className="text-sm text-gray-900">{selectedCompany.businessType || "Not set"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <p className="text-sm text-gray-900">{selectedCompany.country}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
                  <p className="text-sm text-gray-900">{selectedCompany.seatsUsed} / {selectedCompany.maxSeats || "∞"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-sm text-gray-900">{new Date(selectedCompany.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Team Members */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Team Members ({selectedCompany.memberships.length})</h4>
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    + Add Member
                  </button>
                </div>

                {showAddMember && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="EMPLOYEE">Employee (View-only)</option>
                        <option value="MANAGER">Manager (Edit, no AI)</option>
                        <option value="ADMIN">Admin (Full access + AI)</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddMember}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddMember(false);
                          setNewMemberEmail("");
                          setNewMemberName("");
                          setNewMemberRole("EMPLOYEE");
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PIN</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedCompany.memberships.map((membership) => (
                        <tr key={membership.id} className={!membership.isActive ? "bg-gray-50 opacity-60" : ""}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{membership.user.email}</div>
                              <div className="text-sm text-gray-500">{membership.user.name || "No name"}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <select
                              value={membership.role}
                              onChange={(e) => handleChangeRole(membership.id, e.target.value)}
                              disabled={actionLoading}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="EMPLOYEE">Employee (View-only)</option>
                              <option value="MANAGER">Manager (Edit, no AI)</option>
                              <option value="ADMIN">Admin (Full access + AI)</option>
                              {/* Legacy roles for backward compatibility */}
                              <option value="VIEWER">Viewer (Legacy)</option>
                              <option value="EDITOR">Editor (Legacy)</option>
                              <option value="OWNER">Owner (Legacy)</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {membership.pin ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{membership.pin}</span>
                                <button
                                  onClick={() => handleResetPIN(membership.id, membership.user.email)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                  title="Reset PIN"
                                >
                                  Reset
                                </button>
                                <button
                                  onClick={() => handleRemovePIN(membership.id)}
                                  className="text-xs text-red-600 hover:text-red-800"
                                  title="Remove PIN"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleResetPIN(membership.id, membership.user.email)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Set PIN
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleMemberStatus(membership.id, membership.isActive)}
                              disabled={actionLoading}
                              className={`px-2 py-1 text-xs rounded ${
                                membership.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {membership.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {membership.user.lastLoginAt
                              ? new Date(membership.user.lastLoginAt).toLocaleDateString()
                              : "Never"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleResetPassword(membership.user.id, membership.user.email)}
                                className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                title="Reset Password"
                              >
                                Reset PW
                              </button>
                              <button
                                onClick={() => handleRemoveMember(membership.id, membership.user.email)}
                                className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                                title="Remove from Company"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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

