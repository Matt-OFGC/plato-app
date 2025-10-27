import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { CategoryManagerEnhanced } from "@/components/CategoryManagerEnhanced";
import { ShelfLifeManagerEnhanced } from "@/components/ShelfLifeManagerEnhanced";
import { StorageManagerEnhanced } from "@/components/StorageManagerEnhanced";
import { SupplierManager } from "@/components/SupplierManager";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { SettingsTabs } from "@/components/SettingsTabs";
import { TimerSettings } from "@/components/TimerSettings";
import { CurrencySettings } from "@/components/CurrencySettings";
import { FoodCostSettings } from "@/components/FoodCostSettings";

// Force dynamic rendering since this page uses cookies
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");
  
  const { companyId } = await getCurrentUserAndCompany();
  
  // Get user's categories (ordered by custom order)
  const categories = await prisma.category.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { recipes: true }
      }
    },
    orderBy: { order: "asc" }
  });

  // Get user's shelf life options (ordered by custom order)
  const shelfLifeOptions = await prisma.shelfLifeOption.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { recipes: true }
      }
    },
    orderBy: { order: "asc" }
  });

  // Get user's storage options (ordered by custom order)
  const storageOptions = await prisma.storageOption.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { recipes: true }
      }
    },
    orderBy: { order: "asc" }
  });

  // Get user's suppliers
  const suppliersRaw = await prisma.supplier.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { ingredients: true }
      }
    },
    orderBy: { name: "asc" }
  });

  // Serialize suppliers to convert Decimal to number for Client Components
  const suppliers = suppliersRaw.map(supplier => ({
    ...supplier,
    minimumOrder: supplier.minimumOrder ? Number(supplier.minimumOrder) : null,
  }));


  // Server actions removed - now handled by client-side components

  // Get user preferences for display
  const userPreferences = await prisma.userPreference.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="mx-auto max-w-[1280px] px-5 pb-6">
      {/* Header */}
      <div className="mt-4">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account, pricing, and content organization</p>
      </div>

      {/* Subscription Status */}
      <div className="mt-4">
        <SubscriptionStatus />
      </div>

      {/* Tabbed Settings - Navigation tab removed */}
      <div className="mt-3">
        <SettingsTabs>
        {{
          pricing: (
            <section aria-labelledby="pricing-targets" className="space-y-4">
              <h2 id="pricing-targets" className="text-2xl font-bold text-gray-900 mb-4">Pricing & Targets</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Food Cost Targets */}
                <FoodCostSettings 
                  initialTargetFoodCost={Number(userPreferences?.targetFoodCost) || 25}
                  initialMaxFoodCost={Number(userPreferences?.maxFoodCost) || 35}
                />

                {/* Currency Preferences */}
                <CurrencySettings 
                  initialCurrency={userPreferences?.currency || "GBP"}
                />
              </div>
            </section>
          ),
          
          content: (
            <section aria-labelledby="content-organization" className="space-y-4">
              <h2 id="content-organization" className="text-2xl font-bold text-gray-900 mb-4">Content Organization</h2>
              <p className="text-sm text-gray-600 mb-4">Organize your recipes with categories and options. Drag items to reorder them.</p>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Category Management */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <CategoryManagerEnhanced categories={categories} />
                </div>

                {/* Shelf Life Management */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <ShelfLifeManagerEnhanced shelfLifeOptions={shelfLifeOptions} />
                </div>

                {/* Storage Management */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <StorageManagerEnhanced storageOptions={storageOptions} />
                </div>
              </div>
            </section>
          ),
          
          suppliers: (
            <section aria-labelledby="suppliers-info" className="space-y-4">
              <h2 id="suppliers-info" className="text-2xl font-bold text-gray-900 mb-4">Suppliers & Information</h2>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <SupplierManager suppliers={suppliers} />
              </div>
            </section>
          ),
          
          database: (
            <section aria-labelledby="database-management" className="space-y-4">
              <h2 id="database-management" className="text-2xl font-bold text-gray-900 mb-4">Database Management</h2>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="text-center py-8">
                  <p className="text-gray-600">Database management features coming soon...</p>
                </div>
              </div>
            </section>
          ),
          
          timers: (
            <section aria-labelledby="timer-settings" className="space-y-4">
              <h2 id="timer-settings" className="text-2xl font-bold text-gray-900 mb-4">Timer Settings</h2>
              <p className="text-sm text-gray-600 mb-4">Customize how recipe timers alert you when they complete</p>
              <TimerSettings />
            </section>
          ),
        }}
        </SettingsTabs>
      </div>

      {/* Scroll area with bottom-nav clearance */}
      <div className="pb-[calc(var(--bottomnav-h,80px)+env(safe-area-inset-bottom,0px))]">
        {/* Content is handled by SettingsTabs */}
      </div>
    </div>
  );
}


