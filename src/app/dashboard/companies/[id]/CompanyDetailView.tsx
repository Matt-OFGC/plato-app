"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyActivityFeed } from "@/components/CompanyActivityFeed";

interface Company {
  id: number;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  businessType: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  createdAt: Date;
  _count: {
    memberships: number;
    recipes: number;
    ingredients: number;
  };
}

interface Membership {
  id: number;
  role: string;
  isActive: boolean;
}

interface Props {
  company: Company;
  membership: Membership;
  healthMetrics: any;
}

export function CompanyDetailView({ company, membership, healthMetrics }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "settings" | "analytics">("overview");
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/companies/analytics?companyId=${company.id}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleSwitchCompany = async () => {
    try {
      const res = await fetch("/api/companies/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id }),
      });

      if (res.ok) {
        router.refresh();
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Failed to switch company:", error);
    }
  };

  return (
    <div className="app-container">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-gray-600 mt-2">Company details and management</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSwitchCompany}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Switch To This Company
            </button>
            <a
              href="/dashboard/companies"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Companies
            </a>
          </div>
        </div>
      </div>

      {/* Health Score */}
      {healthMetrics && (
        <div className={`mb-6 rounded-xl p-6 ${
          healthMetrics.score >= 80 ? 'bg-green-50 border border-green-200' :
          healthMetrics.score >= 60 ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Company Health</h2>
              <p className="text-gray-600 text-sm">
                {healthMetrics.score >= 80 ? 'Your company is in great shape!' :
                 healthMetrics.score >= 60 ? 'Some areas need attention' :
                 'Several issues need to be addressed'}
              </p>
            </div>
            <div className="text-4xl font-bold text-gray-900">
              {healthMetrics.score}%
            </div>
          </div>
          {healthMetrics.recommendations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {healthMetrics.recommendations.map((rec: string, i: number) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-4">
          {[
            { id: "overview", label: "Overview" },
            { id: "activity", label: "Activity" },
            { id: "analytics", label: "Analytics" },
            { id: "settings", label: "Settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === "analytics" && !analytics) {
                  fetchAnalytics();
                }
              }}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">{company._count.recipes}</div>
            <div className="text-sm text-gray-600 mt-1">Recipes</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">{company._count.ingredients}</div>
            <div className="text-sm text-gray-600 mt-1">Ingredients</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">{company._count.memberships}</div>
            <div className="text-sm text-gray-600 mt-1">Team Members</div>
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <CompanyActivityFeed companyId={company.id} />
      )}

      {activeTab === "analytics" && (
        <div>
          {loadingAnalytics ? (
            <div className="text-center py-8">Loading analytics...</div>
          ) : analytics ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Growth</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recipes (last 30 days)</span>
                      <span className="font-medium">{analytics.growth.recipesLast30Days}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ingredients (last 30 days)</span>
                      <span className="font-medium">{analytics.growth.ingredientsLast30Days}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Activity</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recent Actions</span>
                      <span className="font-medium">{analytics.activity.recentActions}</span>
                    </div>
                    {analytics.activity.lastActivity && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Activity</span>
                        <span className="font-medium">
                          {new Date(analytics.activity.lastActivity).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No analytics data available
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <a
            href="/dashboard/business"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Go to Business Settings →
          </a>
        </div>
      )}
    </div>
  );
}
