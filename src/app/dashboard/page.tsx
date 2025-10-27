import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { DashboardWithOnboarding } from "@/components/DashboardWithOnboarding";
import { OperationalDashboard } from "@/components/OperationalDashboard";
import { AppLauncher } from "@/components/AppLauncher";
import { checkPriceStatus } from "@/lib/priceTracking";

// Force dynamic rendering since this page uses cookies
export const dynamic = 'force-dynamic';
// Revalidate this page every 60 seconds for better performance
export const revalidate = 60;

export default async function DashboardPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard");

  const { companyId, company } = await getCurrentUserAndCompany();
  
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

  // OPTIMIZATION: Run all database queries in parallel
  const [todayProductionPlansRaw, weekProductionPlansRaw, tasksRaw, ingredients, recipeCount, staffCount, shiftsThisWeek] = await Promise.all([
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
        const membership = await prisma.membership.findUnique({
          where: { id: task.assignedTo },
          include: {
            user: {
              select: { name: true },
            },
          },
        });
        assignedToName = membership?.user.name || null;
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
    .filter(ing => ing.priceStatus.status !== 'current');

  return (
    <DashboardWithOnboarding
      showOnboarding={!user.hasCompletedOnboarding}
      userName={user.name || undefined}
      companyName={company?.name || "Your Company"}
    >
      {/* App Launcher - NEW! */}
      <AppLauncher
        recipeCount={recipeCount}
        ingredientCount={ingredients.length}
        staffCount={staffCount}
        shiftsThisWeek={shiftsThisWeek}
      />

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gray-50 text-gray-500 font-medium">
            Today's Operations
          </span>
        </div>
      </div>

      {/* Existing Operational Dashboard - KEPT! */}
      <OperationalDashboard
        todayProduction={todayProduction}
        weekProduction={weekProduction}
        tasks={tasks}
        staleIngredients={staleIngredients}
        userName={user.name || undefined}
      />
    </DashboardWithOnboarding>
  );
}

