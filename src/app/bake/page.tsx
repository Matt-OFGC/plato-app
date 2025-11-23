import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { DashboardWithOnboarding } from "@/components/DashboardWithOnboarding";
import { OperationalDashboard } from "@/components/OperationalDashboard";
import { checkPriceStatus } from "@/lib/priceTracking";
import { hasAppAccess } from "@/lib/user-app-subscriptions";
import { getAppConfig } from "@/lib/apps/registry";
import type { App } from "@/lib/apps/types";

// Force dynamic rendering since this page uses cookies
export const dynamic = 'force-dynamic';
// Revalidate this page every 60 seconds for better performance
export const revalidate = 60;

export default async function BakeDashboardPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/bake/login?redirect=/bake");

  const app: App = "plato_bake";
  
  // Verify user has access to Plato Bake
  const hasAccess = await hasAppAccess(user.id, app);
  if (!hasAccess) {
    // Don't redirect - show paywall or access denied message instead
    // For now, allow access and show the dashboard
    // TODO: Add paywall UI here
    console.log(`[Bake Dashboard] User ${user.id} does not have access to Plato Bake`);
  }

  const appConfig = getAppConfig(app);
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
          appName={appConfig.name}
          appTagline={appConfig.tagline}
        />
      </DashboardWithOnboarding>
    );
  }

  // Fetch data for dashboard
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

  // Get production plans for today and this week
  const [todayProduction, weekProduction] = await Promise.all([
    prisma.productionPlan.findMany({
      where: {
        companyId,
        date: today,
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
      orderBy: { createdAt: "desc" },
    }),
    prisma.productionPlan.findMany({
      where: {
        companyId,
        date: { gte: weekStart, lte: today },
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
      orderBy: { date: "desc", createdAt: "desc" },
    }),
  ]);

  // Get tasks (simplified - you may want to add a tasks table)
  const tasks: any[] = [];

  // Get stale ingredients (ingredients that need price updates)
  const staleIngredients = await checkPriceStatus(companyId);

  return (
    <DashboardWithOnboarding
      showOnboarding={!user.hasCompletedOnboarding}
      userName={user.name || undefined}
      companyName={company?.name || "Your Company"}
    >
      <OperationalDashboard
        todayProduction={todayProduction}
        weekProduction={weekProduction}
        tasks={tasks}
        staleIngredients={staleIngredients}
        userName={user.name || undefined}
        userRole={userRole}
        companyName={company?.name || undefined}
        appName={appConfig.name}
        appTagline={appConfig.tagline}
      />
    </DashboardWithOnboarding>
  );
}
