import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany, getUserRoleInCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import WholesalePageClient from "./WholesalePageClient";

export const dynamic = 'force-dynamic';

export default async function WholesalePage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard/wholesale");

  const result = await getCurrentUserAndCompany();
  const { companyId, user: userWithMemberships } = result;
  
  if (!companyId) {
    // Log for debugging
    console.error("No companyId found for user:", user.id);
    redirect("/dashboard");
  }

  // Get user's role in the company
  const currentUserRole = await getUserRoleInCompany(user.id, companyId) || "MEMBER";

  // Get wholesale customers
  const customers = await prisma.wholesaleCustomer.findMany({
    where: { companyId },
    include: {
      _count: {
        select: {
          orders: true,
          productionItems: true,
        },
      },
    },
    orderBy: { name: "asc" },
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
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Get recent invoices
  const recentInvoices = await prisma.wholesaleInvoice.findMany({
    where: { companyId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Calculate summary stats
  const totalOutstanding = await prisma.wholesaleCustomer.aggregate({
    where: { companyId },
    _sum: {
      outstandingBalance: true,
    },
  });

  const overdueInvoices = await prisma.wholesaleInvoice.count({
    where: {
      companyId,
      status: { not: "paid" },
      dueDate: { lt: new Date() },
    },
  });

  return (
    <WholesalePageClient
      companyId={companyId}
      currentUserRole={currentUserRole}
      customers={customers.map(c => ({
        ...c,
        outstandingBalance: c.outstandingBalance?.toString(),
        totalValue: c.totalValue.toString(),
        totalPaid: c.totalPaid.toString(),
      }))}
      recentOrders={recentOrders}
      recentInvoices={recentInvoices.map(i => ({
        ...i,
        subtotal: i.subtotal.toString(),
        taxAmount: i.taxAmount.toString(),
        total: i.total.toString(),
        paidAmount: i.paidAmount?.toString(),
      }))}
      totalOutstanding={totalOutstanding._sum.outstandingBalance?.toString() || "0"}
      overdueCount={overdueInvoices}
    />
  );
}
