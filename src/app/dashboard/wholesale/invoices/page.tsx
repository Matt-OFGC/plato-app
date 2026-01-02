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
  const currentUserRole = await getUserRoleInCompany(user.id, companyId) || "EMPLOYEE";

  // Get all invoices for this company
  const invoicesRaw = await prisma.wholesaleInvoice.findMany({
    where: { companyId },
    include: {
      customer: true,
      order: true,
    },
    orderBy: {
      issueDate: 'desc',
    },
  });
  // Serialize Prisma decimals/dates to plain objects
  const invoices = JSON.parse(JSON.stringify(invoicesRaw));

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
