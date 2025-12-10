import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { DeliveryNoteManager } from "@/components/DeliveryNoteManager";

export const dynamic = 'force-dynamic';

export default async function WholesaleDeliveryNotesPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard/wholesale/delivery-notes");

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) redirect("/dashboard");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Delivery Notes
        </h1>
        <p className="text-gray-600">
          Create and manage delivery notes for wholesale orders
        </p>
      </div>

      <DeliveryNoteManager companyId={companyId} />
    </div>
  );
}

