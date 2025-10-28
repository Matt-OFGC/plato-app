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

  // Fetch initial data for the dashboard
  const [categories, recipes, recentSales] = await Promise.all([
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
    }),

    // Get recent sales data for initial overview
    prisma.salesRecord.findMany({
      where: { 
        companyId,
        transactionDate: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }
      },
      select: {
        totalRevenue: true,
        transactionDate: true,
        recipeId: true
      },
      orderBy: { transactionDate: 'desc' },
      take: 1000 // Limit for performance
    })
  ]);

  // Calculate initial metrics
  const totalRevenue = recentSales.reduce((sum, sale) => sum + Number(sale.totalRevenue), 0);
  const salesCount = recentSales.length;
  const avgRevenuePerSale = salesCount > 0 ? totalRevenue / salesCount : 0;

  return (
    <AnalyticsPageClient 
      initialCategories={categories}
      initialRecipes={recipes}
      initialMetrics={{
        totalRevenue,
        salesCount,
        avgRevenuePerSale,
        dateRange: {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      }}
    />
  );
}