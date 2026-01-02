import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany, getUserRoleInCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { CompanyLoadingErrorServer } from "@/components/CompanyLoadingErrorServer";
import WholesalePageClient from "./WholesalePageClient";

export const dynamic = 'force-dynamic';

export default async function WholesalePage() {
  try {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard/wholesale");

  const result = await getCurrentUserAndCompany();
  const { companyId } = result;
  
  // Show error component if companyId is null
  if (!companyId) {
    return <CompanyLoadingErrorServer result={result} page="wholesale" />;
  }
  
  // Get user's role in the company
  const currentUserRole = await getUserRoleInCompany(user.id, companyId) || "EMPLOYEE";

  // Get customers
  const customers = await prisma.wholesaleCustomer.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      isActive: true,
      standingOrderEnabled: true,
      standingOrderNotes: true,
      deliveryWindow: true,
      standingSchedule: true,
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

  // Invoices (guarded if table not present yet)
  const invoicesResult = await (async () => {
    try {
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
        orderBy: { issueDate: 'desc' },
        take: 10,
      });

      const totalOutstanding = await prisma.wholesaleInvoice.aggregate({
        where: {
          companyId,
          status: { not: 'paid' },
        },
        _sum: {
          total: true,
        },
      });

      const overdueCount = await prisma.wholesaleInvoice.count({
        where: {
          companyId,
          status: { not: 'paid' },
          dueDate: { lt: new Date() },
        },
      });

      return { recentInvoices, totalOutstanding, overdueCount };
    } catch (err: any) {
      console.warn('[WholesalePage] Invoice queries disabled (table missing?)', err?.message || err);
      return {
        recentInvoices: [],
        totalOutstanding: { _sum: { total: 0 } },
        overdueCount: 0,
      };
    }
  })();

  return (
    <WholesalePageClient
      companyId={companyId}
      currentUserRole={currentUserRole}
      customers={customers}
      recentOrders={recentOrders.map((order: typeof recentOrders[0]) => ({
        ...order,
        customer: {
          id: order.customer.id,
          name: order.customer.name,
        },
      }))}
      recentInvoices={invoicesResult.recentInvoices.map((invoice: typeof invoicesResult.recentInvoices[0]) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total.toString(),
        status: invoice.status,
        dueDate: invoice.dueDate,
        customer: {
          id: invoice.customer.id,
          name: invoice.customer.name,
        },
      }))}
      totalOutstanding={(invoicesResult.totalOutstanding._sum.total || 0).toString()}
      overdueCount={invoicesResult.overdueCount}
    />
  );
  } catch (error) {
    console.error('Wholesale page error:', error);
    const { CompanyLoadingErrorServer } = await import("@/components/CompanyLoadingErrorServer");
    let result;
    try {
      result = await getCurrentUserAndCompany();
    } catch {
      const user = await getUserFromSession().catch(() => null);
      result = {
        companyId: null,
        company: null,
        user: user ? { 
          id: user.id, 
          email: user.email, 
          name: user.name || undefined, 
          isAdmin: false, 
          memberships: [] 
        } : {
          id: 0,
          email: '',
          name: undefined,
          isAdmin: false,
          memberships: []
        },
        app: null,
        appConfig: null,
      };
    }
    return (
      <CompanyLoadingErrorServer 
        result={result} 
        page="wholesale"
      />
    );
  }
}
