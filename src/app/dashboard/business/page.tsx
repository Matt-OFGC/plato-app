import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { BusinessSettingsClient } from "./BusinessSettingsClient";
import { ReportIssue } from "@/components/ReportIssue";

export const dynamic = 'force-dynamic';

export default async function BusinessSettingsPage() {
  const { companyId, company: companyFromCache, user } = await getCurrentUserAndCompany();
  
  // With auto-repair, companyId should always exist, but handle edge case gracefully
  if (!companyId) {
    return (
      <div className="app-container">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">Setting up your company</h2>
          <p className="text-yellow-800 mb-4">
            We're setting up your company account. This should only take a moment. Please refresh the page.
          </p>
          <a
            href="/dashboard/business"
            className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Refresh Page
          </a>
        </div>
      </div>
    );
  }

  // Try to get company from database, use cached if available
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      businessType: true,
      country: true,
      logoUrl: true,
      slug: true,
      isProfilePublic: true,
      profileBio: true,
      showTeam: true,
      showContact: true,
      phone: true,
      email: true,
      website: true,
      address: true,
      city: true,
      postcode: true,
    }
  });

  if (!company) {
    // This should never happen with auto-repair, but handle gracefully
    return (
      <div className="app-container">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Company not found</h2>
          <p className="text-red-800 mb-4">
            We couldn't find your company information. Please try refreshing the page or contact support if this persists.
          </p>
          <a
            href="/dashboard/business"
            className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mr-2"
          >
            Refresh Page
          </a>
          <ReportIssue
            context={{
              page: "business-settings",
              error: "Company not found",
              userId: user.id,
              companyId: companyId,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Settings</h1>
        <p className="text-gray-600 mt-2">Manage your business information and preferences</p>
      </div>

      <BusinessSettingsClient company={company} />
    </div>
  );
}