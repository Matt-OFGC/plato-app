import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { AnalyticsPageClient } from "./AnalyticsPageClient";

export const dynamic = 'force-dynamic';
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
  let categories: any[] = [];
  let recipes: any[] = [];
  
  try {
    const [categoriesResult, recipesResult] = await Promise.all([
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
    
    categories = categoriesResult;
    recipes = recipesResult;
  } catch (error) {
    const { logger } = await import("@/lib/logger");
    logger.error('Database error in analytics page:', error);
    // Use empty arrays to prevent page crash
    categories = [];
    recipes = [];
  }

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