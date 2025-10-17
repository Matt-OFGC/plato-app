import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { CategoryManagerEnhanced } from "@/components/CategoryManagerEnhanced";
import { ShelfLifeManagerEnhanced } from "@/components/ShelfLifeManagerEnhanced";
import { StorageManagerEnhanced } from "@/components/StorageManagerEnhanced";
import { SupplierManager } from "@/components/SupplierManager";
import { DatabaseManager } from "@/components/DatabaseManager";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { SettingsTabs } from "@/components/SettingsTabs";
import { TimerSettings } from "@/components/TimerSettings";
import { NavigationSettingsClient } from "@/components/NavigationSettingsClient";
import { CurrencySettings } from "@/app/components/CurrencySettings";
import { FoodCostSettings } from "@/app/components/FoodCostSettings";

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

  // Get all data for database management
  const allIngredientsRaw = await prisma.ingredient.findMany({
    where: { companyId },
    include: { supplierRef: true },
    orderBy: { name: "asc" }
  });

  const allRecipesRaw = await prisma.recipe.findMany({
    where: { companyId },
    include: { 
      categoryRef: true,
      storageRef: true,
      shelfLifeRef: true
    },
    orderBy: { name: "asc" }
  });

  // Serialize data to convert Decimal to number for Client Components
  const allIngredients = allIngredientsRaw.map(ing => ({
    ...ing,
    packQuantity: ing.packQuantity.toNumber(),
    packPrice: ing.packPrice.toNumber(),
    densityGPerMl: ing.densityGPerMl?.toNumber() || null,
    supplierRef: ing.supplierRef ? {
      ...ing.supplierRef,
      minimumOrder: ing.supplierRef.minimumOrder ? Number(ing.supplierRef.minimumOrder) : null,
    } : null,
  }));

  const allRecipes = allRecipesRaw;

  // Server actions removed - now handled by client-side components

  // Get user preferences for display
  const userPreferences = await prisma.userPreference.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account, pricing, and content organization</p>
      </div>

      {/* Subscription Status */}
      <SubscriptionStatus />

      {/* Tabbed Settings */}
      <SettingsTabs>
        {{
          pricing: (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing & Targets</h2>
              <div className="grid gap-6 lg:grid-cols-2">
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
            </div>
          ),
          
          content: (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Content Organization</h2>
              <p className="text-sm text-gray-600 mb-6">Organize your recipes with categories and options. Drag items to reorder them.</p>
              <div className="grid gap-6 lg:grid-cols-2">
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
            </div>
          ),
          
          suppliers: (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Suppliers & Information</h2>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <SupplierManager suppliers={suppliers} />
              </div>
            </div>
          ),
          
          database: (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Database Management</h2>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <DatabaseManager 
                  ingredients={allIngredients}
                  recipes={allRecipes}
                  suppliers={suppliers}
                  categories={categories}
                  shelfLifeOptions={shelfLifeOptions}
                  storageOptions={storageOptions}
                />
              </div>
            </div>
          ),
          
          navigation: (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Navigation Preferences</h2>
              <p className="text-sm text-gray-600 mb-6">Customize which navigation items appear in your floating navigation bar</p>
              <NavigationSettingsClient />
            </div>
          ),
          
          timers: (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Timer Settings</h2>
              <p className="text-sm text-gray-600 mb-6">Customize how recipe timers alert you when they complete</p>
              <TimerSettings />
            </div>
          ),
        }}
      </SettingsTabs>
    </div>
  );
}


