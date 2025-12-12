import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import WholesalePageClient from "./WholesalePageClient";

export const dynamic = 'force-dynamic';

export default async function WholesalePage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard/wholesale");

  const { companyId, currentUserRole } = await getCurrentUserAndCompany();
  if (!companyId) redirect("/dashboard");

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
