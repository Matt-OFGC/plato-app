import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { BusinessSettingsClient } from "../business/BusinessSettingsClient";
import { CompanyLoadingErrorServer } from "@/components/CompanyLoadingErrorServer";
import { redirect } from "next/navigation";
import { getUserFromSession } from "@/lib/auth-simple";

export const dynamic = "force-dynamic";

export default async function CompanySettingsPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/settings/company");

  const result = await getCurrentUserAndCompany();
  const { companyId } = result;

  if (!companyId) {
    return <CompanyLoadingErrorServer result={result} page="company-settings" />;
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_companyId: {
        userId: user.id,
        companyId,
      },
    },
    select: {
      role: true,
      isActive: true,
    },
  });

  const isAdmin = !!membership && membership.isActive && membership.role === "ADMIN";

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
      invoicingBankName: true,
      invoicingBankAccount: true,
      invoicingSortCode: true,
      invoicingInstructions: true,
    },
  });

  if (!company) {
    return (
      <CompanyLoadingErrorServer
        result={result}
        page="company-settings"
        message="Company not found"
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Company & Wholesale Settings</h1>
        <p className="text-gray-600 mt-2">
          Business profile, address, contact, and wholesale invoicing details (bank, payment
          instructions).
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        {isAdmin ? (
          <BusinessSettingsClient company={company} />
        ) : (
          <div className="space-y-4 text-sm text-gray-700">
            <p className="text-gray-800 font-semibold">Company: {company.name}</p>
            <p>Business type: {company.businessType || "—"}</p>
            <p>Phone: {company.phone || "—"}</p>
            <p>Email: {company.email || "—"}</p>
            <p>Website: {company.website || "—"}</p>
            <p>
              Address: {[company.address, company.city, company.postcode].filter(Boolean).join(", ") || "—"}
            </p>
            <div className="border-t pt-3">
              <p className="text-gray-800 font-semibold">Invoicing / Bank</p>
              <p>Bank: {company.invoicingBankName || "—"}</p>
              <p>Account: {company.invoicingBankAccount || "—"}</p>
              <p>Sort code: {company.invoicingSortCode || "—"}</p>
              <p>Payment instructions: {company.invoicingInstructions || "—"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

