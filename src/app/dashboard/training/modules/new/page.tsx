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

  // Check permission - allow ADMIN and OWNER for MVP
  const membership = await prisma.membership.findUnique({
    where: {
      userId_companyId: {
        userId: user.id,
        companyId,
      },
    },
  });

  const canCreate = membership && membership.isActive && 
    (membership.role === "ADMIN" || membership.role === "OWNER");
  
  if (!canCreate) {
    redirect("/dashboard/training");
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create Training Module</h1>
        <p className="text-sm text-gray-600 mt-1">
          Build a new training module with content and media for your team
        </p>
      </div>

      <TrainingModuleBuilder companyId={companyId} />
    </div>
  );
}

