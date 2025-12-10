import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { InvoiceManager } from "@/components/InvoiceManager";

export const dynamic = 'force-dynamic';

export default async function WholesaleInvoicesPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard/wholesale/invoices");

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) redirect("/dashboard");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Invoices
        </h1>
        <p className="text-gray-600">
          Manage invoices and track payments from your wholesale customers
        </p>
      </div>

      <InvoiceManager companyId={companyId} />
    </div>
  );
}

