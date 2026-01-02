import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { BusinessSettingsClient } from "../business/BusinessSettingsClient";
import { CompanyLoadingErrorServer } from "@/components/CompanyLoadingErrorServer";

// Force dynamic rendering since this page uses cookies
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const result = await getCurrentUserAndCompany();
  const { companyId } = result;

  if (!companyId) {
    return <CompanyLoadingErrorServer result={result} page="account-settings" />;
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

  const settingsPages = [
    {
      id: 'company',
      label: 'Company',
      href: '/settings/company',
      description: 'Business profile & wholesale invoicing',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      id: 'subscription',
      label: 'Subscription',
      href: '/dashboard/account/subscription',
      description: 'Upgrade & manage plan',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      id: 'pricing',
      label: 'Pricing',
      href: '/dashboard/account/pricing',
      description: 'Food cost targets & currency',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'content',
      label: 'Content',
      href: '/dashboard/account/content',
      description: 'Categories, shelf life & storage',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      href: '/dashboard/account/suppliers',
      description: 'Manage your suppliers',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'timers',
      label: 'Timers',
      href: '/dashboard/account/timers',
      description: 'Timer preferences',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'preferences',
      label: 'Preferences',
      href: '/dashboard/account/preferences',
      description: 'App preferences & shortcuts',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'from-indigo-500 to-indigo-600'
    },
  ];

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-2">Settings</h1>
        <p className="text-gray-500 text-lg mb-4">
          Manage your account, company profile, and wholesale invoicing details from one place.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsPages.map((page) => (
          <Link
            key={page.id}
            href={page.href}
            className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${page.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-200`}>
              {page.icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">{page.label}</h3>
            <p className="text-sm text-gray-500">{page.description}</p>
          </Link>
        ))}
      </div>

    </div>
  );
}


