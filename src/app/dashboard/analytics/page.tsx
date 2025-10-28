import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { AnalyticsPageClient } from "./AnalyticsPageClient";

// Cache for 5 minutes to improve performance
export const revalidate = 300;

export default async function AnalyticsPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) {
    redirect("/dashboard");
  }

  // Get basic data for initial load - much lighter queries
  const [categories, recipes] = await Promise.all([
    // Get categories for filtering
    prisma.category.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        _count: {
          select: { recipes: true }
        }
      },
      orderBy: { name: 'asc' }
    }),

    // Get recipes for filtering
    prisma.recipe.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        categoryRef: {
          select: { name: true }
        }
      },
      orderBy: { name: 'asc' }
    })
  ]);

  return (
    <AnalyticsPageClient 
      initialCategories={categories}
      initialRecipes={recipes}
      initialMetrics={{
        totalRevenue: 0,
        salesCount: 0,
        avgRevenuePerSale: 0,
        dateRange: {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      }}
    />
  );
}