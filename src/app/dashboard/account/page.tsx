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
import { UserPreferences } from "@/components/UserPreferences";

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
    <div className="app-container pb-6">
      {/* Modern Header */}
      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base">
              Manage your account preferences, pricing, and content organization
            </p>
          </div>
          {/* Quick Actions Hint */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <p className="text-sm text-emerald-800 font-medium">
              💡 Tip: You can add categories, suppliers, and more directly from recipe & ingredient pages!
            </p>
          </div>
        </div>
      </div>

      {/* Tabbed Settings */}
      <div className="mt-6">
        <SettingsTabs>
        {{
          subscription: (
            <section aria-labelledby="subscription" className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-6 mb-6">
                <h2 id="subscription" className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Subscription & Plan
                </h2>
                <p className="text-gray-600 text-sm">Manage your subscription, upgrade to Pro, or handle billing</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <SubscriptionStatus />
              </div>
            </section>
          ),
          pricing: (
            <section aria-labelledby="pricing-targets" className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-6 mb-6">
                <h2 id="pricing-targets" className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pricing & Targets
                </h2>
                <p className="text-gray-600 text-sm">Set your food cost targets and preferred currency for accurate recipe costing</p>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Food Cost Targets */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <FoodCostSettings 
                    initialTargetFoodCost={Number(userPreferences?.targetFoodCost) || 25}
                    initialMaxFoodCost={Number(userPreferences?.maxFoodCost) || 35}
                  />
                </div>

                {/* Currency Preferences */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <CurrencySettings 
                    initialCurrency={userPreferences?.currency || "GBP"}
                  />
                </div>
              </div>
            </section>
          ),
          
          content: (
            <section aria-labelledby="content-organization" className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-6 mb-6">
                <h2 id="content-organization" className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Content Organization
                </h2>
                <p className="text-gray-600 text-sm">
                  Organize your recipes with categories, shelf life, and storage options. Drag items to reorder them.
                  <span className="block mt-1 text-emerald-700 font-medium">✨ Quick add these directly from recipe & ingredient pages!</span>
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {/* Category Management */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <CategoryManagerEnhanced categories={categories} />
                </div>

                {/* Shelf Life Management */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <ShelfLifeManagerEnhanced shelfLifeOptions={shelfLifeOptions} />
                </div>

                {/* Storage Management */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <StorageManagerEnhanced storageOptions={storageOptions} />
                </div>
              </div>
            </section>
          ),
          
          suppliers: (
            <section aria-labelledby="suppliers-info" className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-6 mb-6">
                <h2 id="suppliers-info" className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Suppliers & Information
                </h2>
                <p className="text-gray-600 text-sm">
                  Manage your ingredient suppliers and their details. 
                  <span className="block mt-1 text-emerald-700 font-medium">✨ Quick add suppliers directly from ingredient pages!</span>
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <SupplierManager suppliers={suppliers} />
              </div>
            </section>
          ),
          
          timers: (
            <section aria-labelledby="timer-settings" className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-6 mb-6">
                <h2 id="timer-settings" className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Timer Settings
                </h2>
                <p className="text-gray-600 text-sm">Customize how recipe timers alert you when they complete</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <TimerSettings />
              </div>
            </section>
          ),
          
          preferences: (
            <section aria-labelledby="user-preferences" className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-6 mb-6">
                <h2 id="user-preferences" className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  App Preferences
                </h2>
                <p className="text-gray-600 text-sm">Customize defaults, display options, and notifications to match your workflow</p>
              </div>
              <UserPreferences />
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


