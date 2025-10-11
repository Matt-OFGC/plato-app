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
  const suppliers = await prisma.supplier.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { ingredients: true }
      }
    },
    orderBy: { name: "asc" }
  });

  // Get all data for database management
  const allIngredients = await prisma.ingredient.findMany({
    where: { companyId },
    include: { supplierRef: true },
    orderBy: { name: "asc" }
  });

  const allRecipes = await prisma.recipe.findMany({
    where: { companyId },
    include: { 
      categoryRef: true,
      storageRef: true,
      shelfLifeRef: true
    },
    orderBy: { name: "asc" }
  });

  async function updateCurrency(formData: FormData) {
    "use server";
    if (!user) return redirect("/login");
    const currency = String(formData.get("currency") || "GBP");
    await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, currency },
      update: { currency },
    });
    return redirect("/dashboard/account");
  }

  async function updateFoodCostTargets(formData: FormData) {
    "use server";
    if (!user) return redirect("/login");
    const targetFoodCost = parseFloat(String(formData.get("targetFoodCost") || "25"));
    const maxFoodCost = parseFloat(String(formData.get("maxFoodCost") || "35"));
    
    await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: { 
        userId: user.id, 
        targetFoodCost,
        maxFoodCost,
        currency: "GBP"
      },
      update: { 
        targetFoodCost,
        maxFoodCost
      },
    });
    return redirect("/dashboard/account");
  }

  // Get user preferences for display
  const userPreferences = await prisma.userPreference.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
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
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Food Cost Targets</h3>
                  <p className="text-sm text-gray-600 mb-4">Set your ideal food cost percentages</p>
                  <form action={updateFoodCostTargets} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Target Food Cost %
                <span className="text-xs text-emerald-600 ml-2">Industry standard: 25%</span>
              </label>
              <input 
                type="number" 
                step="1"
                min="10"
                max="50"
                name="targetFoodCost" 
                defaultValue={userPreferences?.targetFoodCost?.toString() ?? "25"}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="25"
              />
              <p className="text-xs text-gray-500 mt-1">Your ideal food cost percentage (lower is better)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Maximum Food Cost %
                <span className="text-xs text-amber-600 ml-2">Typically 30-35%</span>
              </label>
              <input 
                type="number" 
                step="1"
                min="20"
                max="60"
                name="maxFoodCost" 
                defaultValue={userPreferences?.maxFoodCost?.toString() ?? "35"}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="35"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum acceptable food cost before alerts</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-800">
                <strong>💡 How it works:</strong> If your target is 25%, a recipe costing £1 should sell for £4. 
                Plato will auto-calculate suggested prices based on your targets.
              </p>
            </div>
            <button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-lg hover:shadow-lg transition-all font-medium">
              Save Food Cost Targets
            </button>
          </form>
        </div>

        {/* Currency Preferences */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Currency Preferences</h2>
          <form action={updateCurrency} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Default Currency</label>
              <select 
                name="currency" 
                defaultValue={userPreferences?.currency ?? "GBP"} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <button className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:bg-[var(--accent)] transition-colors font-medium">
              Save Currency
            </button>
          </form>
                </div>
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
                <SupplierManager suppliers={suppliers as any} />
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


