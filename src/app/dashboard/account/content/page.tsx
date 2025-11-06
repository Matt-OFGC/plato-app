import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { CategoryManagerEnhanced } from "@/components/CategoryManagerEnhanced";
import { ShelfLifeManagerEnhanced } from "@/components/ShelfLifeManagerEnhanced";
import { StorageManagerEnhanced } from "@/components/StorageManagerEnhanced";

export const dynamic = 'force-dynamic';

export default async function ContentPage() {
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

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-2">Content</h1>
        <p className="text-gray-500 text-lg mb-6">Organize your recipes with categories, shelf life, and storage options. Drag items to reorder them.</p>
      </div>

      {/* Content Management */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Category Management */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <CategoryManagerEnhanced categories={categories} />
        </div>

        {/* Shelf Life Management */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <ShelfLifeManagerEnhanced shelfLifeOptions={shelfLifeOptions} />
        </div>

        {/* Storage Management */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <StorageManagerEnhanced storageOptions={storageOptions} />
        </div>
      </div>
    </div>
  );
}




