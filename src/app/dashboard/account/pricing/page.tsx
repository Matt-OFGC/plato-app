import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { CurrencySettings } from "@/components/CurrencySettings";
import { FoodCostSettings } from "@/components/FoodCostSettings";

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  // Get user preferences for display
  const userPreferences = await prisma.userPreference.findUnique({
    where: { userId: user.id },
  });

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-2">Pricing</h1>
        <p className="text-gray-500 text-lg mb-6">Set your food cost targets and preferred currency for accurate recipe costing</p>
      </div>

      {/* Pricing Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Food Cost Targets */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <FoodCostSettings 
            initialTargetFoodCost={Number(userPreferences?.targetFoodCost) || 25}
            initialMaxFoodCost={Number(userPreferences?.maxFoodCost) || 35}
          />
        </div>

        {/* Currency Preferences */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <CurrencySettings 
            initialCurrency={userPreferences?.currency || "GBP"}
          />
        </div>
      </div>
    </div>
  );
}

