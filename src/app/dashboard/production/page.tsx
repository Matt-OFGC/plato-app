import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { CompanyLoadingErrorServer } from "@/components/CompanyLoadingErrorServer";
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

  const result = await getCurrentUserAndCompany();
  const { companyId } = result;
  
  // Show error component if companyId is null
  if (!companyId) {
    return <CompanyLoadingErrorServer result={result} page="production" />;
  }

  // Get basic recipes data - much lighter query
  const recipesRaw = await prisma.recipe.findMany({
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
          wholesaleCustomers={[]}
          companyId={companyId}
        />
      </div>
    </div>
  );
}