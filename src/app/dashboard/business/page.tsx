import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { BusinessSettingsClient } from "./BusinessSettingsClient";

export default async function BusinessSettingsPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");
  
  const { companyId } = await getCurrentUserAndCompany();
  
  if (!companyId) {
    return <div>Company not found</div>;
  }
  
  // Get company details
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      memberships: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      }
    }
  });

  if (!company) {
    return <div>Company not found</div>;
  }

  // Check if user is admin or owner
  const membership = company.memberships.find((m) => m.userId === user.id);
  const isAdmin = membership?.role === "ADMIN" || membership?.role === "OWNER";

  // Serialize company data for client component
  const companyData = {
    id: company.id,
    name: company.name,
    slug: company.slug,
    businessType: company.businessType,
    phone: company.phone,
    email: company.email,
    website: company.website,
    address: company.address,
    city: company.city,
    postcode: company.postcode,
    country: company.country,
    logoUrl: company.logoUrl,
    isProfilePublic: company.isProfilePublic,
    profileBio: company.profileBio,
    showTeam: company.showTeam,
    showContact: company.showContact,
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your business information and public profile
        </p>
      </div>

      {!isAdmin ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            You need admin permissions to edit business settings.
          </p>
        </div>
      ) : (
        <BusinessSettingsClient company={companyData} />
      )}
    </div>
  );
}

