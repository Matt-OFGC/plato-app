import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { InvoiceDetailClient } from "../InvoiceDetailClient";
import { CompanyLoadingErrorServer } from "@/components/CompanyLoadingErrorServer";

export const dynamic = "force-dynamic";

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const resolvedParams = await params;
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard/wholesale/invoices");

  const result = await getCurrentUserAndCompany();
  const { companyId } = result;

  if (!companyId) {
    return <CompanyLoadingErrorServer result={result} page="wholesale-invoice-detail" />;
  }

  const invoiceId = Number(resolvedParams.id);
  if (Number.isNaN(invoiceId)) {
    return notFound();
  }

  try {
    const invoice = await prisma.wholesaleInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        company: true,
        order: {
          include: {
            items: {
              include: {
                recipe: true,
              },
            },
          },
        },
      },
    });

    if (!invoice || invoice.companyId !== companyId) {
      return notFound();
    }

    const serialised = JSON.parse(JSON.stringify(invoice));

    return (
      <div className="p-6">
        <InvoiceDetailClient invoice={serialised} />
      </div>
    );
  } catch (error) {
    console.error("Failed to load invoice", { invoiceId, error });
    return notFound();
  }
}
