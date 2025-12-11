"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Company {
  id: number;
  name: string;
  logoUrl?: string | null;
  businessType?: string | null;
}

interface Membership {
  id: number;
  companyId: number;
  role: string;
  isActive: boolean;
  company: Company;
}

export function CompanySwitcher() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState<Membership[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
    fetchCurrentCompany();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies/list");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentCompany = async () => {
    try {
      const res = await fetch("/api/session");
      if (res.ok) {
        const data = await res.json();
        setCurrentCompany(data.company);
      }
    } catch (error) {
      console.error("Failed to fetch current company:", error);
    }
  };

  const handleSwitchCompany = async (companyId: number) => {
    try {
      const res = await fetch("/api/companies/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      if (res.ok) {
        setIsOpen(false);
        // Refresh the page to load new company context
        router.refresh();
        window.location.href = "/dashboard";
      } else {
        alert("Failed to switch company. Please try again.");
      }
    } catch (error) {
      console.error("Failed to switch company:", error);
      alert("Failed to switch company. Please try again.");
    }
  };

  if (loading || companies.length <= 1) {
    // Don't show switcher if user only has one company
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
      >
        {currentCompany?.logoUrl ? (
          <img
            src={currentCompany.logoUrl}
            alt={currentCompany.name}
            className="w-5 h-5 rounded object-cover"
          />
        ) : (
          <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-emerald-700">
              {currentCompany?.name?.charAt(0)?.toUpperCase() || "C"}
            </span>
          </div>
        )}
        <span className="max-w-[120px] truncate">
          {currentCompany?.name || "Select Company"}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase mb-1">
                Your Companies
              </div>
              {companies.map((membership) => (
                <button
                  key={membership.id}
                  onClick={() => handleSwitchCompany(membership.companyId)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentCompany?.id === membership.companyId
                      ? "bg-emerald-50 text-emerald-900"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {membership.company.logoUrl ? (
                    <img
                      src={membership.company.logoUrl}
                      alt={membership.company.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-emerald-700">
                        {membership.company.name?.charAt(0)?.toUpperCase() || "C"}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{membership.company.name}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {membership.role.toLowerCase()}
                    </div>
                  </div>
                  {currentCompany?.id === membership.companyId && (
                    <svg
                      className="w-4 h-4 text-emerald-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
              <div className="border-t border-gray-200 mt-2 pt-2">
                <a
                  href="/dashboard/companies"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-50 text-gray-700 text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create New Company
                </a>
                <a
                  href="/dashboard/companies"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-50 text-gray-700 text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  Manage Companies
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
