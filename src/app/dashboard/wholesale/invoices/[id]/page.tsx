import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import InvoiceDetailClient from "./InvoiceDetailClient";

export const dynamic = 'force-dynamic';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { id } = await params;
  const invoiceId = parseInt(id);

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) redirect("/dashboard");

  const invoice = await prisma.wholesaleInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      order: {
        include: {
          items: {
            include: {
              recipe: {
                select: {
                  id: true,
                  name: true,
                  yieldQuantity: true,
                  yieldUnit: true,
                },
              },
            },
          },
        },
      },
      WholesalePayment: {
        orderBy: {
          paymentDate: "desc",
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      Company: {
        select: {
          name: true,
          address: true,
          city: true,
          postcode: true,
          country: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!invoice) {
    redirect("/dashboard/wholesale/invoices");
  }

  return (
    <InvoiceDetailClient
      invoice={{
        ...invoice,
        subtotal: invoice.subtotal.toString(),
        taxRate: invoice.taxRate.toString(),
        taxAmount: invoice.taxAmount.toString(),
        total: invoice.total.toString(),
        paidAmount: invoice.paidAmount?.toString(),
        customer: {
          ...invoice.customer,
          creditLimit: invoice.customer.creditLimit?.toString(),
          totalValue: invoice.customer.totalValue.toString(),
          totalPaid: invoice.customer.totalPaid.toString(),
          outstandingBalance: invoice.customer.outstandingBalance.toString(),
        },
        WholesalePayment: invoice.WholesalePayment.map(p => ({
          ...p,
          amount: p.amount.toString(),
        })),
      }}
      companyId={companyId}
    />
  );
}

