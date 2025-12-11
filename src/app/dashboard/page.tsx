import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { DashboardWithOnboarding } from "@/components/DashboardWithOnboarding";
import { OperationalDashboard } from "@/components/OperationalDashboard";
import { checkPriceStatus } from "@/lib/priceTracking";
import { hasAppAccess } from "@/lib/user-app-subscriptions";
import { getAppConfig } from "@/lib/apps/registry";
import { getAppFromRoute } from "@/lib/app-routes";
import type { App } from "@/lib/apps/types";

// Force dynamic rendering since this page uses cookies
export const dynamic = 'force-dynamic';
// Revalidate this page every 60 seconds for better performance
export const revalidate = 60;

interface DashboardPageProps {
  searchParams: Promise<{ app?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard");

  const resolvedSearchParams = await searchParams;
  
  let companyId: number | null = null;
  let company: any = null;
  let userWithMemberships: any = null;
  let companyApp: any = null;
  let companyAppConfig: any = null;
  
  try {
    const result = await getCurrentUserAndCompany();
    companyId = result.companyId;
    company = result.company;
    userWithMemberships = result.user;
    companyApp = result.app;
    companyAppConfig = result.appConfig;
  } catch (error) {
    console.error('Error fetching user and company:', error);
    // Graceful degradation: show limited functionality instead of complete error
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">Limited Access</h2>
          <p className="text-yellow-800 mb-4">
            We're having trouble loading your company information. Some features may be limited.
          </p>
          <div className="flex gap-3">
            <a
              href="/dashboard"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
            >
              Refresh Page
            </a>
            <a
              href="/dashboard/account"
              className="px-4 py-2 border border-yellow-600 text-yellow-800 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              Account Settings
            </a>
          </div>
        </div>
        
        {/* Show basic dashboard with limited functionality */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/dashboard/account"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">Account Settings</h3>
              <p className="text-sm text-gray-600">Manage your account</p>
            </a>
            <a
              href="/login"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">Sign Out</h3>
              <p className="text-sm text-gray-600">Sign out and try again</p>
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // App detection from route is handled by the route itself (/bake/* routes)
  // For /dashboard routes, we check query params or use company default
  const appFromRoute = null; // Will be set by route-specific pages
  
  // Check if an app is specified in route, query params, or use company default
  let app: App | null = appFromRoute || companyApp;
  let appConfig = appFromRoute ? getAppConfig(appFromRoute) : companyAppConfig;
  
  if (resolvedSearchParams.app && !appFromRoute) {
    const requestedApp = resolvedSearchParams.app as App;
    // Verify user has access to the requested app
    const hasAccess = await hasAppAccess(user.id, requestedApp);
    if (hasAccess) {
      app = requestedApp;
      appConfig = getAppConfig(requestedApp);
    }
  }
  
  // If app detected from route, verify user has access
  if (appFromRoute) {
    const hasAccess = await hasAppAccess(user.id, appFromRoute);
    if (!hasAccess) {
      // Redirect to main dashboard if user doesn't have access
      redirect("/dashboard");
    }
  }

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
          todayOrders={[]}
          weekOrders={[]}
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
  let todayOrdersRaw: any[] = [];
  let weekOrdersRaw: any[] = [];
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

      // Wholesale orders due today
      prisma.wholesaleOrder.findMany({
        where: {
          companyId,
          deliveryDate: {
            gte: today,
            lt: tomorrow,
          },
          status: {
            in: ["pending", "confirmed", "in_production"],
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
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
        orderBy: [
          { status: 'asc' },
          { deliveryDate: 'asc' },
        ],
      }),

      // Wholesale orders due this week
      prisma.wholesaleOrder.findMany({
        where: {
          companyId,
          deliveryDate: {
            gte: today,
            lt: weekEnd,
          },
          status: {
            in: ["pending", "confirmed", "in_production"],
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
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
        orderBy: [
          { status: 'asc' },
          { deliveryDate: 'asc' },
        ],
      }),

      // Get ingredients for stale price checking
      prisma.ingredient.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          lastPriceUpdate: true,
          packPrice: true,
          currency: true,
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
    todayOrdersRaw = results[3].status === 'fulfilled' ? results[3].value : [];
    weekOrdersRaw = results[4].status === 'fulfilled' ? results[4].value : [];
    ingredients = results[5].status === 'fulfilled' ? results[5].value : [];
    recipeCount = results[6].status === 'fulfilled' ? results[6].value : 0;
    staffCount = results[7].status === 'fulfilled' ? results[7].value : 0;
    shiftsThisWeek = results[8].status === 'fulfilled' ? results[8].value : 0;

    // Log any rejected promises for debugging
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Query ${index} failed:`, result.reason);
      }
    });

  } catch (error) {
    console.error('Database error in dashboard page:', error);
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch dashboard data. Check database connection.');
    }
    // All values already set to defaults above
  }

  // Helper function to convert Prisma Decimal to number (for serialization to client components)
  const serializeDecimal = (value: any): number => {
    if (value === null || value === undefined) return value as any;
    if (typeof value === 'object' && value !== null) {
      // Check if it's a Prisma Decimal object
      if ('toNumber' in value) {
        return (value as any).toNumber();
      }
      if ('toString' in value) {
        return parseFloat((value as any).toString());
      }
    }
    return typeof value === 'number' ? value : Number(value);
  };

  // Serialize for client components - convert all Decimal fields
  const todayProduction = todayProductionPlansRaw.map(plan => ({
    ...plan,
    startDate: plan.startDate.toISOString(),
    endDate: plan.endDate.toISOString(),
    items: plan.items.map(item => ({
      ...item,
      quantity: serializeDecimal(item.quantity),
      recipe: {
        ...item.recipe,
        yieldQuantity: serializeDecimal(item.recipe.yieldQuantity),
      },
    })),
  }));

  const weekProduction = weekProductionPlansRaw.map(plan => ({
    ...plan,
    startDate: plan.startDate.toISOString(),
    endDate: plan.endDate.toISOString(),
    items: plan.items.map(item => ({
      ...item,
      quantity: serializeDecimal(item.quantity),
      recipe: {
        ...item.recipe,
        yieldQuantity: serializeDecimal(item.recipe.yieldQuantity),
      },
    })),
  }));

  // Serialize wholesale orders for today - with extensive error handling
  let todayOrders: any[] = [];
  try {
    if (todayOrdersRaw && Array.isArray(todayOrdersRaw)) {
      todayOrders = todayOrdersRaw.map((order: any) => {
        try {
          return {
            id: order?.id || 0,
            orderNumber: order?.orderNumber || null,
            deliveryDate: order?.deliveryDate ? (order.deliveryDate instanceof Date ? order.deliveryDate.toISOString() : new Date(order.deliveryDate).toISOString()) : null,
            status: order?.status || 'pending',
            customer: {
              id: order?.customer?.id || 0,
              name: order?.customer?.name || 'Unknown',
            },
            items: Array.isArray(order?.items) ? order.items.map((item: any) => {
              try {
                return {
                  id: item?.id || 0,
                  quantity: item?.quantity ? serializeDecimal(item.quantity) : 0,
                  price: item?.price !== null && item?.price !== undefined ? serializeDecimal(item.price) : null,
                  recipe: {
                    id: item?.recipe?.id || 0,
                    name: item?.recipe?.name || 'Unknown',
                    yieldQuantity: item?.recipe?.yieldQuantity ? serializeDecimal(item.recipe.yieldQuantity) : '0',
                  },
                };
              } catch (itemError) {
                console.error('Error serializing order item:', itemError);
                return null;
              }
            }).filter(Boolean) : [],
          };
        } catch (orderError) {
          console.error('Error serializing order:', orderError);
          return null;
        }
      }).filter(Boolean);
    }
  } catch (error) {
    console.error('Error serializing today orders:', error);
    todayOrders = [];
  }

  // Serialize wholesale orders for this week - with extensive error handling
  let weekOrders: any[] = [];
  try {
    if (weekOrdersRaw && Array.isArray(weekOrdersRaw)) {
      weekOrders = weekOrdersRaw.map((order: any) => {
        try {
          return {
            id: order?.id || 0,
            orderNumber: order?.orderNumber || null,
            deliveryDate: order?.deliveryDate ? (order.deliveryDate instanceof Date ? order.deliveryDate.toISOString() : new Date(order.deliveryDate).toISOString()) : null,
            status: order?.status || 'pending',
            customer: {
              id: order?.customer?.id || 0,
              name: order?.customer?.name || 'Unknown',
            },
            items: Array.isArray(order?.items) ? order.items.map((item: any) => {
              try {
                return {
                  id: item?.id || 0,
                  quantity: item?.quantity ? serializeDecimal(item.quantity) : 0,
                  price: item?.price !== null && item?.price !== undefined ? serializeDecimal(item.price) : null,
                  recipe: {
                    id: item?.recipe?.id || 0,
                    name: item?.recipe?.name || 'Unknown',
                    yieldQuantity: item?.recipe?.yieldQuantity ? serializeDecimal(item.recipe.yieldQuantity) : '0',
                  },
                };
              } catch (itemError) {
                console.error('Error serializing order item:', itemError);
                return null;
              }
            }).filter(Boolean) : [],
          };
        } catch (orderError) {
          console.error('Error serializing order:', orderError);
          return null;
        }
      }).filter(Boolean);
    }
  } catch (error) {
    console.error('Error serializing week orders:', error);
    weekOrders = [];
  }

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

  // Check for stale prices and serialize Decimal values
  const staleIngredients = ingredients
    .map(ing => {
      const priceStatusResult = checkPriceStatus(ing.lastPriceUpdate);
      
      return {
        id: ing.id,
        name: ing.name,
        lastPriceUpdate: ing.lastPriceUpdate,
        currency: ing.currency,
        packPrice: serializeDecimal(ing.packPrice), // Convert Decimal to number
        priceStatus: priceStatusResult.status,
        daysSinceUpdate: priceStatusResult.daysSinceUpdate,
      };
    })
    .filter(ing => {
      // Only show ingredients that are actually stale or warning (not fresh)
      // Exclude items with 0 or negative days (just updated today or future dates)
      // Exclude Infinity (null dates are handled separately)
      return ing.priceStatus !== 'fresh' && 
             ing.daysSinceUpdate > 0 && 
             ing.daysSinceUpdate !== Infinity &&
             ing.daysSinceUpdate < 10000; // Sanity check for reasonable dates
    });

  // Ensure all arrays are defined
  const safeTodayProduction = Array.isArray(todayProduction) ? todayProduction : [];
  const safeWeekProduction = Array.isArray(weekProduction) ? weekProduction : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeTodayOrders = Array.isArray(todayOrders) ? todayOrders : [];
  const safeWeekOrders = Array.isArray(weekOrders) ? weekOrders : [];
  const safeStaleIngredients = Array.isArray(staleIngredients) ? staleIngredients : [];

  try {
    return (
      <DashboardWithOnboarding
        showOnboarding={!user.hasCompletedOnboarding}
        userName={user.name || undefined}
        companyName={company?.name || "Your Company"}
      >
        <OperationalDashboard
          todayProduction={safeTodayProduction}
          weekProduction={safeWeekProduction}
          tasks={safeTasks}
          todayOrders={safeTodayOrders}
          weekOrders={safeWeekOrders}
          staleIngredients={safeStaleIngredients}
          userName={user.name || undefined}
          userRole={userRole}
          companyName={company?.name || undefined}
          appName={appConfig?.name}
          appTagline={appConfig?.tagline}
        />
      </DashboardWithOnboarding>
    );
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
        <p className="text-red-600">{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
      </div>
    );
  }
}