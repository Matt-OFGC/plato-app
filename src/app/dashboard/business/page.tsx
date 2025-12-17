import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { BusinessSettingsClient } from "./BusinessSettingsClient";
import { CompanyLoadingError } from "@/components/CompanyLoadingError";

export const dynamic = 'force-dynamic';

export default async function BusinessSettingsPage() {
  const { companyId, company: companyFromCache, user } = await getCurrentUserAndCompany();
  
  // With auto-repair, companyId should always exist, but handle edge case gracefully
  if (!companyId) {
    return (
      <CompanyLoadingError
        user={user}
        title="Setting up your company"
        description="We're setting up your company account. This should only take a moment. Please refresh the page or try again."
        showRetry={true}
        showReportIssue={true}
        errorContext={{
          page: "business-settings",
          error: "Company ID is null after getCurrentUserAndCompany",
        }}
      />
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
      <CompanyLoadingError
        user={user}
        title="Company not found"
        description="We couldn't find your company information. Please try refreshing the page or contact support if this persists."
        errorMessage={`Company ID ${companyId} was found but company data could not be loaded from database.`}
        showRetry={true}
        showReportIssue={true}
        errorContext={{
          page: "business-settings",
          error: `Company not found for ID: ${companyId}`,
        }}
      />
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