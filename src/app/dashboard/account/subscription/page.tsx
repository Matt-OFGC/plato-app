import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { getCurrentUserAndCompany } from "@/lib/current";
import { buildSubscriptionStatusPayload } from "@/lib/subscription-status";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function SubscriptionPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) redirect("/dashboard");

  // Check if user has ADMIN or OWNER role (ADMIN-only access for billing)
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

  if (!membership || !membership.isActive || (membership.role !== "ADMIN" && membership.role !== "OWNER")) {
    redirect("/dashboard?error=access_denied");
  }

  const initialStatus = await buildSubscriptionStatusPayload(user.id, companyId);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-2">Subscription</h1>
        <p className="text-gray-500 text-lg mb-6">Manage your subscription, upgrade to Pro, or handle billing</p>
      </div>

      {/* Subscription Content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <SubscriptionStatus initialData={initialStatus} />
      </div>
    </div>
  );
}










