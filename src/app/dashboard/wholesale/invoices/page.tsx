import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany, getUserRoleInCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { CompanyLoadingErrorServer } from "@/components/CompanyLoadingErrorServer";
import InvoicesPageClient from "./InvoicesPageClient";

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard/wholesale/invoices");

  const result = await getCurrentUserAndCompany();
  const { companyId } = result;
  
  // Show error component if companyId is null
  if (!companyId) {
    return <CompanyLoadingErrorServer result={result} page="wholesale-invoices" />;
  }
  
  // Get user's role in the company
  const currentUserRole = await getUserRoleInCompany(user.id, companyId) || "VIEWER";

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
