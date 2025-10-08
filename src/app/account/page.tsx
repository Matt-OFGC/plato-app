import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { CategoryManager } from "@/components/CategoryManager";
import { ShelfLifeManager } from "@/components/ShelfLifeManager";
import { StorageManager } from "@/components/StorageManager";
import { SupplierManager } from "@/components/SupplierManager";
import { DatabaseManager } from "@/components/DatabaseManager";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { preferences: true } });
  if (!user) redirect("/login");
  
  const { companyId } = await getCurrentUserAndCompany();
  
  // Get user's categories
  const categories = await prisma.category.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { recipes: true }
      }
    },
    orderBy: { name: "asc" }
  });

  // Get user's shelf life options
  const shelfLifeOptions = await prisma.shelfLifeOption.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { recipes: true }
      }
    },
    orderBy: { name: "asc" }
  });

  // Get user's storage options
  const storageOptions = await prisma.storageOption.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { recipes: true }
      }
    },
    orderBy: { name: "asc" }
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

  async function action(formData: FormData) {
    "use server";
    if (!user) return redirect("/login");
    const currency = String(formData.get("currency") || "GBP");
    await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, currency },
      update: { currency },
    });
    return redirect("/account");
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Account Settings</h1>
        <p className="text-[var(--muted-foreground)] mt-2">Manage your account preferences and categories</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Currency Preferences */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Currency Preferences</h2>
          <form action={action} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Default Currency</label>
              <select 
                name="currency" 
                defaultValue={user.preferences?.currency ?? "GBP"} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <button className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg hover:bg-[var(--accent)] transition-colors font-medium">
              Save Preferences
            </button>
          </form>
        </div>

        {/* Category Management */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <CategoryManager categories={categories} />
        </div>
      </div>

      {/* Additional Options Management */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Shelf Life Management */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <ShelfLifeManager shelfLifeOptions={shelfLifeOptions} />
        </div>

        {/* Storage Management */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <StorageManager storageOptions={storageOptions} />
        </div>
      </div>

      {/* Supplier Management */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <SupplierManager suppliers={suppliers as any} />
      </div>

      {/* Database Management */}
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
  );
}


