import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { BusinessSettingsClient } from "./BusinessSettingsClient";

export const dynamic = 'force-dynamic';

export default async function BusinessSettingsPage() {
  const { companyId } = await getCurrentUserAndCompany();
  
  if (!companyId) {
    return <div className="p-6">No company found</div>;
  }

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
    return <div className="p-6">Company not found</div>;
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