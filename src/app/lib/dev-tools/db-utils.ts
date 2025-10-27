import { prisma } from "@/lib/prisma";

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const [
      userCount,
      companyCount,
      recipeCount,
      ingredientCount,
      activityCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.recipe.count(),
      prisma.ingredient.count(),
      prisma.activityLog.count(),
    ]);

    return {
      users: userCount,
      companies: companyCount,
      recipes: recipeCount,
      ingredients: ingredientCount,
      activityLogs: activityCount,
    };
  } catch (error) {
    console.error("Error getting database stats:", error);
    throw error;
  }
}

/**
 * Check database connection health
 */
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true, message: "Database connection OK" };
  } catch (error) {
    return { 
      healthy: false, 
      message: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Get table sizes (PostgreSQL only)
 */
export async function getTableSizes() {
  try {
    const result = await prisma.$queryRaw<Array<{ table_name: string; size: number }>>`
      SELECT 
        table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;
    return result;
  } catch (error) {
    console.error("Error getting table sizes:", error);
    return [];
  }
}

/**
 * Get slow queries (if query logging is enabled)
 */
export async function getSlowQueries() {
  // This would require enabling PostgreSQL's pg_stat_statements
  // For now, return empty array
  return [];
}
