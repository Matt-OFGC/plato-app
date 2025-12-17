import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany, getUserRoleInCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { CompanyLoadingErrorServer } from "@/components/CompanyLoadingErrorServer";
import WholesalePageClient from "./WholesalePageClient";

export const dynamic = 'force-dynamic';

export default async function WholesalePage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard/wholesale");

  const result = await getCurrentUserAndCompany();
  const { companyId } = result;
  
  // Show error component if companyId is null
  if (!companyId) {
    return <CompanyLoadingErrorServer result={result} page="wholesale" />;
  }
  
  // Get user's role in the company
  const currentUserRole = await getUserRoleInCompany(user.id, companyId) || "VIEWER";

  // Get customers
  const customers = await prisma.wholesaleCustomer.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      isActive: true,
      _count: {
        select: {
          orders: true,
          productionItems: true,
        },
      },
    },
  });

  // Get recent orders
  const recentOrders = await prisma.wholesaleOrder.findMany({
    where: { companyId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Get recent invoices
  const recentInvoices = await prisma.wholesaleInvoice.findMany({
    where: { companyId },
    include: {
      WholesaleCustomer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { issueDate: 'desc' },
    take: 10,
  });

  // Calculate total outstanding
  const totalOutstanding = await prisma.wholesaleInvoice.aggregate({
    where: {
      companyId,
      status: { not: 'paid' },
    },
    _sum: {
      total: true,
    },
  });

  // Count overdue invoices
  const overdueCount = await prisma.wholesaleInvoice.count({
    where: {
      companyId,
      status: { not: 'paid' },
      dueDate: { lt: new Date() },
    },
  });

  return (
    <WholesalePageClient
      companyId={companyId}
      currentUserRole={currentUserRole}
      customers={customers}
      recentOrders={recentOrders.map(order => ({
        ...order,
        customer: {
          id: order.customer.id,
          name: order.customer.name,
        },
      }))}
      recentInvoices={recentInvoices.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total.toString(),
        status: invoice.status,
        dueDate: invoice.dueDate,
        customer: {
          id: invoice.WholesaleCustomer.id,
          name: invoice.WholesaleCustomer.name,
        },
      }))}
      totalOutstanding={(totalOutstanding._sum.total || 0).toString()}
      overdueCount={overdueCount}
    />
  );
}
