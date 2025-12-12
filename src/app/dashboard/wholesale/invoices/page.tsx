import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import InvoicesPageClient from "./InvoicesPageClient";

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard/wholesale/invoices");

  const { companyId, currentUserRole } = await getCurrentUserAndCompany();
  if (!companyId) redirect("/dashboard");

  // Get all invoices for this company
  const invoices = await prisma.wholesaleInvoice.findMany({
    where: { companyId },
    include: {
      WholesaleCustomer: true,
      WholesaleOrder: true,
    },
    orderBy: {
      issueDate: 'desc',
    },
  });

  // Get customers for filtering
  const customers = await prisma.wholesaleCustomer.findMany({
    where: { companyId },
    orderBy: { name: 'asc' },
  });

  return (
    <InvoicesPageClient
      companyId={companyId}
      currentUserRole={currentUserRole}
      invoices={invoices}
      customers={customers}
    />
  );
}
