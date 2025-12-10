import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { ProductionPlannerEnhanced } from "@/components/ProductionPlannerEnhanced";
// Temporarily disabled to fix build error
// import { checkSectionAccess } from "@/lib/features";

export const dynamic = 'force-dynamic';
// Cache for 2 minutes to improve performance
export const revalidate = 120;

export default async function ProductionPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  // Temporarily disabled to fix build error
  // Check if user has Production module unlocked
  // const hasAccess = await checkSectionAccess(user.id, "production");
  // if (!hasAccess) {
  //   redirect("/dashboard?locked=production");
  // }

  let result;
  try {
    result = await getCurrentUserAndCompany();
  } catch (error) {
    console.error("Error getting user and company:", error);
    redirect("/dashboard");
  }

  let { companyId, user: userWithMemberships, company } = result;
  
  // If no company, automatically create one for the user
  if (!companyId && userWithMemberships) {
    try {
      // Generate a default company name from user's name or email
      const defaultCompanyName = userWithMemberships.name 
        ? `${userWithMemberships.name}'s Company`
        : `${userWithMemberships.email.split('@')[0]}'s Company`;
      
      // Generate unique slug
      const { generateUniqueSlug } = await import('@/lib/slug');
      const slug = await generateUniqueSlug(defaultCompanyName, async (slug) => {
        const existing = await prisma.company.findUnique({ where: { slug } });
        return !!existing;
      });
      
      // Create company with default values
      const newCompany = await prisma.company.create({
        data: {
          name: defaultCompanyName,
          slug,
          businessType: 'bakery', // Default business type
          country: 'United Kingdom', // Default country
        },
      });

      // Create membership for the user as ADMIN
      await prisma.membership.create({
        data: {
          userId: userWithMemberships.id,
          companyId: newCompany.id,
          role: 'ADMIN',
          isActive: true,
        },
      });

      // Update companyId for this request
      companyId = newCompany.id;
      company = newCompany;
      
      console.log(`Auto-created company for user ${userWithMemberships.id}: ${newCompany.name} (ID: ${newCompany.id})`);
    } catch (error) {
      console.error("Error auto-creating company:", error);
      // If auto-creation fails, show error message
      return (
        <div className="space-y-6">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-2">Production Plan</h1>
            <p className="text-gray-500 text-lg">Plan production schedules, manage tasks, and track progress</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Error Setting Up Company</h2>
            <p className="text-gray-600 mb-6">
              There was an error setting up your company. Please try refreshing the page.
            </p>
            <a
              href="/dashboard"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      );
    }
  }

  // Get basic recipes data - much lighter query
  let recipesRaw = [];
  let wholesaleCustomers = [];
  
  try {
    recipesRaw = await prisma.recipe.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        yieldQuantity: true,
        yieldUnit: true,
        categoryId: true,
        category: true,
        imageUrl: true,
        sections: {
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { name: "asc" },
      take: 50, // Limit for performance
    });

    // Get wholesale customers for production allocations
    wholesaleCustomers = await prisma.wholesaleCustomer.findMany({
      where: {
        companyId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching production data:", error);
    // Continue with empty arrays - page will still render
  }

  // Serialize Decimal objects to strings for client components
  const recipes = recipesRaw.map(recipe => ({
    ...recipe,
    yieldQuantity: recipe.yieldQuantity.toString(),
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-2">Production Plan</h1>
        <p className="text-gray-500 text-lg">Plan production schedules, manage tasks, and track progress</p>
      </div>

      {/* Main Content Container */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
        <ProductionPlannerEnhanced
          recipes={recipes}
          productionPlans={[]}
          teamMembers={[]}
          wholesaleCustomers={wholesaleCustomers}
          companyId={companyId}
        />
      </div>
    </div>
  );
}