import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";

export const dynamic = 'force-dynamic';

export default async function SubscriptionPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-2">Subscription</h1>
        <p className="text-gray-500 text-lg mb-6">Manage your subscription, upgrade to Pro, or handle billing</p>
      </div>

      {/* Subscription Content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <SubscriptionStatus />
      </div>
    </div>
  );
}




