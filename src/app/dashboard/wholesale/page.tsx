import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany, getUserRoleInCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import WholesalePageClient from "./WholesalePageClient";

export const dynamic = 'force-dynamic';

export default async function WholesalePage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard/wholesale");

  let result;
  try {
    result = await getCurrentUserAndCompany();
  } catch (error) {
    console.error("Error getting user and company:", error);
    redirect("/dashboard");
  }

  const { companyId, user: userWithMemberships, company } = result;
  
  // If no company, show empty state instead of redirecting (like main dashboard does)
  if (!companyId) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wholesale</h1>
          <p className="text-gray-600 mt-1">Manage wholesale customers and orders</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Company Found</h2>
          <p className="text-gray-600 mb-6">
            {userWithMemberships?.memberships && userWithMemberships.memberships.length > 0
              ? "You don't have an active company membership. Please contact your administrator."
              : "You need to create or join a company to use wholesale features."}
          </p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Get user's role in the company
  const currentUserRole = await getUserRoleInCompany(user.id, companyId) || "MEMBER";

  // Get wholesale customers
  let customers = [];
  let recentOrders = [];
  let recentInvoices = [];
  let totalOutstanding = { _sum: { outstandingBalance: null } };
  let overdueInvoices = 0;

  try {
    customers = await prisma.wholesaleCustomer.findMany({
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
    recentOrders = await prisma.wholesaleOrder.findMany({
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

    // Get recent invoices (may fail if table doesn't exist yet)
    try {
      recentInvoices = await prisma.wholesaleInvoice.findMany({
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
      totalOutstanding = await prisma.wholesaleCustomer.aggregate({
        where: { companyId },
        _sum: {
          outstandingBalance: true,
        },
      });

      overdueInvoices = await prisma.wholesaleInvoice.count({
        where: {
          companyId,
          status: { not: "paid" },
          dueDate: { lt: new Date() },
        },
      });
    } catch (invoiceError) {
      // Tables might not exist yet - migrations may not have run
      console.warn("Invoice/delivery note tables may not exist yet:", invoiceError);
      recentInvoices = [];
      totalOutstanding = { _sum: { outstandingBalance: null } };
      overdueInvoices = 0;
    }
  } catch (error) {
    console.error("Error fetching wholesale data:", error);
    // Continue with empty arrays - page will still render
  }

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
