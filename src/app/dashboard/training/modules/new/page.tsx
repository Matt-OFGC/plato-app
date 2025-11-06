import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { checkPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import TrainingModuleBuilder from "./components/TrainingModuleBuilder";

export const dynamic = "force-dynamic";

export default async function NewTrainingModulePage() {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login?redirect=/dashboard/training/modules/new");
  }

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) {
    redirect("/dashboard");
  }

  // Check permission
  const canCreate = await checkPermission(
    user.id,
    companyId,
    "training:create"
  );
  if (!canCreate) {
    redirect("/dashboard/training");
  }

  // Get recipes for linking
  const recipes = await prisma.recipe.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Training Module</h1>
        <p className="text-gray-600 mt-2">
          Build a new training module with content, media, and recipe links
        </p>
      </div>

      <TrainingModuleBuilder companyId={companyId} recipes={recipes} />
    </div>
  );
}

