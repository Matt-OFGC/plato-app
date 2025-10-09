import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/currency";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BusinessProfilePage({ params }: Props) {
  const { slug } = await params;

  const company = await prisma.company.findUnique({
    where: { 
      slug: slug,
      isProfilePublic: true 
    },
    include: {
      memberships: {
        where: { role: { not: "VIEWER" } },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      }
    }
  });

  if (!company) {
    notFound();
  }

  // Get some sample recipes (public ones if any)
  const recipes = await prisma.recipe.findMany({
    where: {
      companyId: company.id,
    },
    take: 6,
    include: {
      items: {
        include: {
          ingredient: {
            select: {
              id: true,
              name: true,
              packPrice: true,
              packQuantity: true,
              packUnit: true,
              densityGPerMl: true,
            }
          }
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start gap-6">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={`${company.name} logo`}
                className="w-24 h-24 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-400">
                  {company.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
              
              {company.businessType && (
                <p className="text-lg text-gray-600 mb-4">{company.businessType}</p>
              )}
              
              {company.profileBio && (
                <p className="text-gray-700 leading-relaxed">{company.profileBio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Featured Recipes */}
            {recipes.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Recipes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recipes.map((recipe) => (
                    <div key={recipe.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{recipe.name}</h3>
                      
                      {recipe.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{recipe.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Yield: {recipe.yieldQuantity} {recipe.yieldUnit}</span>
                        {recipe.portionsPerBatch && recipe.portionsPerBatch > 1 && (
                          <span>{recipe.portionsPerBatch} servings</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Business Description */}
            {company.profileBio && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About Us</h2>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-gray-700 leading-relaxed">{company.profileBio}</p>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            {company.showContact && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {company.email && (
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${company.email}`} className="text-blue-600 hover:text-blue-800">
                        {company.email}
                      </a>
                    </div>
                  )}
                  
                  {company.phone && (
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href={`tel:${company.phone}`} className="text-blue-600 hover:text-blue-800">
                        {company.phone}
                      </a>
                    </div>
                  )}
                  
                  {company.website && (
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                      </svg>
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        Visit Website
                      </a>
                    </div>
                  )}
                  
                  {(company.address || company.city) && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="text-gray-700">
                        {company.address && <div>{company.address}</div>}
                        {(company.city || company.postcode) && (
                          <div>{[company.city, company.postcode].filter(Boolean).join(' ')}</div>
                        )}
                        {company.country && <div>{company.country}</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Team */}
            {company.showTeam && company.memberships.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Team</h3>
                <div className="space-y-3">
                  {company.memberships.map((membership) => (
                    <div key={membership.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-emerald-700">
                          {membership.user.name?.charAt(0) || membership.user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {membership.user.name || membership.user.email}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {membership.role.toLowerCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
