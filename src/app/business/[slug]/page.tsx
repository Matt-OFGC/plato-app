import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default async function BusinessProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const company = await prisma.company.findUnique({
    where: { slug: params.slug },
    include: {
      memberships: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { role: "asc" },
      },
    },
  });

  if (!company || !company.isProfilePublic) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {company.logoUrl ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200">
                  <Image
                    src={company.logoUrl}
                    alt={company.name}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {company.name[0]}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                {company.businessType && (
                  <p className="text-gray-600">{company.businessType}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                P
              </div>
              <span className="text-sm text-gray-600">Powered by Plato</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* About */}
            {company.profileBio && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
                <p className="text-gray-700 whitespace-pre-line">{company.profileBio}</p>
              </div>
            )}

            {/* Team Members */}
            {company.showTeam && company.memberships.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Team</h2>
                <div className="space-y-3">
                  {company.memberships.map((membership) => (
                    <div
                      key={membership.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
                        {membership.user.name?.[0] || membership.user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {membership.user.name || "Team Member"}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {membership.role.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Contact & Details */}
          <div className="space-y-6">
            {/* Contact Information */}
            {company.showContact && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
                <div className="space-y-3">
                  {company.email && (
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-gray-400 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <a
                        href={`mailto:${company.email}`}
                        className="text-emerald-600 hover:text-emerald-700 break-all"
                      >
                        {company.email}
                      </a>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-gray-400 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <a
                        href={`tel:${company.phone}`}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        {company.phone}
                      </a>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-gray-400 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 break-all"
                      >
                        {company.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location */}
            {company.showContact && (company.address || company.city || company.country) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-gray-400 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div className="text-gray-700">
                    {company.address && <p>{company.address}</p>}
                    {company.city && company.postcode && (
                      <p>
                        {company.city}, {company.postcode}
                      </p>
                    )}
                    {company.country && <p>{company.country}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Get Started CTA */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Try Plato</h3>
              <p className="text-emerald-50 text-sm mb-4">
                Manage your recipes, ingredients, and costs like {company.name}
              </p>
              <Link
                href="/register"
                className="block w-full text-center bg-white text-emerald-600 py-2 px-4 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-gray-600">
          <p className="text-sm">
            This profile is powered by{" "}
            <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Plato Kitchen
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

