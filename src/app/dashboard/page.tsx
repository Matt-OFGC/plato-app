import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { DashboardWithOnboarding } from "@/components/DashboardWithOnboarding";
import { OperationalDashboard } from "@/components/OperationalDashboard";
import { AppLauncher } from "@/components/AppLauncher";

// Revalidate this page every 5 minutes for better performance
export const revalidate = 300;

export default async function DashboardPage() {
  const user = await getUserFromSession();
  console.log('Dashboard: User from session:', user ? { id: user.id, email: user.email } : 'No user');
  
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

  // Get basic counts for app launcher - much lighter queries
  // Temporarily disabled while Prisma client is being set up
  let recipeCount = 0;
  let staffCount = 0;
  try {
    [recipeCount, staffCount] = await Promise.all([
      prisma.recipe.count({ where: { companyId } }),
      prisma.membership.count({ where: { companyId, isActive: true } })
    ]);
  } catch (error) {
    console.log('Dashboard: Could not fetch counts, using defaults');
  }

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
      
      <AppLauncher 
        recipeCount={recipeCount}
        ingredientCount={0}
        staffCount={staffCount}
        shiftsThisWeek={0}
      />
    </DashboardWithOnboarding>
  );
}