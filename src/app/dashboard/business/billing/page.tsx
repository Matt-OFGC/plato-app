import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function BusinessBillingPage() {
  const { companyId, user } = await getCurrentUserAndCompany();
  
  if (!companyId) {
    redirect("/dashboard");
  }

  // Check if user has ADMIN role (ADMIN-only access)
  const membership = await prisma.membership.findUnique({
    where: {
      userId_companyId: {
        userId: user.id,
        companyId,
      },
    },
    select: {
      role: true,
      isActive: true,
    },
  });

  if (!membership || !membership.isActive || membership.role !== "ADMIN") {
    redirect("/dashboard?error=access_denied");
  }

  // Redirect to subscription page
  redirect("/dashboard/account/subscription");
}

