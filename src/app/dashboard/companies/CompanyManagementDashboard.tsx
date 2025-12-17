"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Company {
  id: number;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  businessType: string | null;
  country: string | null;
  createdAt: Date;
  _count: {
    memberships: number;
    recipes: number;
    ingredients: number;
  };
}

interface Membership {
  id: number;
  companyId: number;
  role: string;
  isActive: boolean;
  company: Company;
}

interface Props {
  memberships: Membership[];
  currentCompanyId: number | null;
}

export function CompanyManagementDashboard({ memberships, currentCompanyId }: Props) {
  const router = useRouter();
  const [switching, setSwitching] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ companyId: number; companyName: string } | null>(null);

  const handleSwitchCompany = async (companyId: number) => {
    setSwitching(companyId);
    try {
      const res = await fetch("/api/companies/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      if (res.ok) {
        router.refresh();
        window.location.href = "/dashboard";
      } else {
        const data = await res.json();
        alert(data.error || "Failed to switch company");
      }
    } catch (error) {
      console.error("Failed to switch company:", error);
      alert("Failed to switch company. Please try again.");
    } finally {
      setSwitching(null);
    }
  };

  const handleCreateCompany = () => {
    router.push("/register?action=create_company");
  };

  const handleDeleteClick = (companyId: number, companyName: string) => {
    setDeleteConfirm({ companyId, companyName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    const { companyId } = deleteConfirm;
    setDeleting(companyId);
    
    try {
      const res = await fetch("/api/companies/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh the page to show updated list
        router.refresh();
        setDeleteConfirm(null);
        // If we deleted the current company, redirect to companies page
        if (currentCompanyId === companyId) {
          window.location.href = "/dashboard/companies";
        }
      } else {
        alert(data.error || "Failed to delete company");
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Failed to delete company:", error);
      alert("Failed to delete company. Please try again.");
      setDeleteConfirm(null);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-2xl font-bold text-gray-900">{memberships.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Companies</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-2xl font-bold text-gray-900">
            {memberships.reduce((sum, m) => sum + m.company._count.recipes, 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total Recipes</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-2xl font-bold text-gray-900">
            {memberships.reduce((sum, m) => sum + m.company._count.ingredients, 0)}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total Ingredients</div>
        </div>
      </div>

      {/* Companies List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Your Companies</h2>
          <button
            onClick={handleCreateCompany}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            + Create New Company
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {memberships.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">You don't have any companies yet.</p>
              <button
                onClick={handleCreateCompany}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Create Your First Company
              </button>
            </div>
          ) : (
            memberships.map((membership) => {
              const isCurrent = currentCompanyId === membership.companyId;
              return (
                <div
                  key={membership.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    isCurrent ? "bg-emerald-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {membership.company.logoUrl ? (
                        <img
                          src={membership.company.logoUrl}
                          alt={membership.company.name}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-emerald-100 flex items-center justify-center border border-gray-200">
                          <span className="text-2xl font-bold text-emerald-700">
                            {membership.company.name?.charAt(0)?.toUpperCase() || "C"}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {membership.company.name}
                          </h3>
                          {isCurrent && (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                              Current
                            </span>
                          )}
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded capitalize">
                            {membership.role.toLowerCase()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          {membership.company.businessType && (
                            <span>{membership.company.businessType}</span>
                          )}
                          {membership.company.country && (
                            <span>{membership.company.country}</span>
                          )}
                          <span>
                            {membership.company._count.memberships} member
                            {membership.company._count.memberships !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>
                            {membership.company._count.recipes} recipes
                          </span>
                          <span>
                            {membership.company._count.ingredients} ingredients
                          </span>
                          <span>
                            Created {new Date(membership.company.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!isCurrent && (
                        <button
                          onClick={() => handleSwitchCompany(membership.companyId)}
                          disabled={switching === membership.companyId}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          {switching === membership.companyId ? "Switching..." : "Switch To"}
                        </button>
                      )}
                      <a
                        href={`/dashboard/business`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Settings
                      </a>
                      {(membership.role === "OWNER" || membership.role === "ADMIN") && (
                        <button
                          onClick={() => handleDeleteClick(membership.companyId, membership.company.name)}
                          disabled={deleting === membership.companyId}
                          className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                          title={membership.role === "OWNER" ? "Delete company" : "Only company owners can delete companies"}
                        >
                          {deleting === membership.companyId ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Delete Company</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.companyName}</strong>? 
              This will archive the company and deactivate all memberships. All data will be preserved.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting !== null}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {deleting !== null ? "Deleting..." : "Delete Company"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

