import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { DashboardWithOnboarding } from "@/components/DashboardWithOnboarding";
import { OperationalDashboard } from "@/components/OperationalDashboard";
import { checkPriceStatus } from "@/lib/priceTracking";

// Force dynamic rendering since this page uses cookies
export const dynamic = 'force-dynamic';
// Revalidate this page every 60 seconds for better performance
export const revalidate = 60;

export default async function DashboardPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard");

  const { companyId, company, user: userWithMemberships } = await getCurrentUserAndCompany();

  // Get user's role in the current company
  const membership = userWithMemberships?.memberships.find(m => m.companyId === companyId);
  const userRole = membership?.role;
  
  // If no company, show empty state
  if (!companyId) {
    return (
      <DashboardWithOnboarding
        showOnboarding={!user.hasCompletedOnboarding}
        userName={user.name || undefined}
        companyName={company?.name || "Your Company"}
      >
        <OperationalDashboard
          todayProduction={[]}
          weekProduction={[]}
          tasks={[]}
          staleIngredients={[]}
          userName={user.name || undefined}
          userRole={userRole}
          companyName={company?.name || undefined}
        />
      </DashboardWithOnboarding>
    );
  }

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get week range (today to 7 days from now)
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // OPTIMIZATION: Run all database queries in parallel with safety
  let todayProductionPlansRaw: any[] = [];
  let weekProductionPlansRaw: any[] = [];
  let tasksRaw: any[] = [];
  let ingredients: any[] = [];
  let recipeCount = 0;
  let staffCount = 0;
  let shiftsThisWeek = 0;

  try {
    const results = await Promise.allSettled([
      // Today's production plans
      prisma.productionPlan.findMany({
        where: {
          companyId,
          startDate: { lte: tomorrow },
          endDate: { gte: today },
        },
        include: {
          items: {
            include: {
              recipe: {
                select: {
                  id: true,
                  name: true,
                  yieldQuantity: true,
                  yieldUnit: true,
                },
              },
            },
            orderBy: { priority: 'desc' },
          },
        },
        orderBy: { startDate: 'asc' },
      }),

      // This week's production plans
      prisma.productionPlan.findMany({
        where: {
          companyId,
          startDate: { lte: weekEnd },
          endDate: { gte: today },
        },
        include: {
          items: {
            include: {
              recipe: {
                select: {
                  id: true,
                  name: true,
                  yieldQuantity: true,
                  yieldUnit: true,
                },
              },
            },
          },
        },
        orderBy: { startDate: 'asc' },
        take: 10,
      }),

      // Tasks for this week
      prisma.productionTask.findMany({
        where: {
          plan: { companyId },
          OR: [
            { dueDate: null },
            { dueDate: { lte: weekEnd } },
          ],
        },
        include: {
          plan: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          { completed: 'asc' },
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
        take: 20,
      }),

      // Get ingredients for stale price checking
      prisma.ingredient.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          lastPriceUpdate: true,
        },
        orderBy: { lastPriceUpdate: "asc" },
      }),

      // Get recipe count for app launcher
      prisma.recipe.count({
        where: { companyId },
      }),

      // Get active staff count for app launcher
      prisma.membership.count({
        where: {
          companyId,
          isActive: true,
        },
      }),

      // Get this week's shifts count
      prisma.shift.count({
        where: {
          companyId,
          date: {
            gte: today,
            lt: weekEnd,
          },
        },
      }),
    ]);

    // Extract results safely
    todayProductionPlansRaw = results[0].status === 'fulfilled' ? results[0].value : [];
    weekProductionPlansRaw = results[1].status === 'fulfilled' ? results[1].value : [];
    tasksRaw = results[2].status === 'fulfilled' ? results[2].value : [];
    ingredients = results[3].status === 'fulfilled' ? results[3].value : [];
    recipeCount = results[4].status === 'fulfilled' ? results[4].value : 0;
    staffCount = results[5].status === 'fulfilled' ? results[5].value : 0;
    shiftsThisWeek = results[6].status === 'fulfilled' ? results[6].value : 0;

  } catch (error) {
    console.error('Database error in dashboard page:', error);
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch dashboard data. Check database connection.');
    }
    // All values already set to defaults above
  }

  // Serialize for client components
  const todayProduction = todayProductionPlansRaw.map(plan => ({
    ...plan,
    startDate: plan.startDate.toISOString(),
    endDate: plan.endDate.toISOString(),
    items: plan.items.map(item => ({
      ...item,
      recipe: {
        ...item.recipe,
        yieldQuantity: item.recipe.yieldQuantity.toString(),
      },
    })),
  }));

  const weekProduction = weekProductionPlansRaw.map(plan => ({
    ...plan,
    startDate: plan.startDate.toISOString(),
    endDate: plan.endDate.toISOString(),
    items: plan.items.map(item => ({
      ...item,
      recipe: {
        ...item.recipe,
        yieldQuantity: item.recipe.yieldQuantity.toString(),
      },
    })),
  }));

  // Get team member names for tasks
  const tasks = await Promise.all(
    tasksRaw.map(async (task) => {
      let assignedToName = null;
      if (task.assignedTo) {
        try {
          const membership = await prisma.membership.findUnique({
            where: { id: task.assignedTo },
            include: {
              user: {
                select: { name: true },
              },
            },
          });
          assignedToName = membership?.user.name || null;
        } catch (error) {
          console.error('Error fetching task assignment:', error);
        }
      }

      return {
        ...task,
        dueDate: task.dueDate?.toISOString() || null,
        planName: task.plan.name,
        assignedToName,
      };
    })
  );

  // Check for stale prices
  const staleIngredients = ingredients
    .map(ing => ({
      ...ing,
      priceStatus: checkPriceStatus(ing.lastPriceUpdate),
      daysSinceUpdate: Math.floor((new Date().getTime() - ing.lastPriceUpdate.getTime()) / (1000 * 60 * 60 * 24)),
    }))
    .filter(ing => ing.priceStatus !== 'fresh');

  return (
    <DashboardWithOnboarding
      showOnboarding={!user.hasCompletedOnboarding}
      userName={user.name || undefined}
      companyName={company?.name || "Your Company"}
    >
      {/* Operational Dashboard */}
      <OperationalDashboard
        todayProduction={todayProduction}
        weekProduction={weekProduction}
        tasks={tasks}
        staleIngredients={staleIngredients}
        userName={user.name || undefined}
        userRole={userRole}
        companyName={company?.name || undefined}
      />
    </DashboardWithOnboarding>
  );
}