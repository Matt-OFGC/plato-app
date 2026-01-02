import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { InvoiceDetailClient } from "../InvoiceDetailClient";
import { CompanyLoadingErrorServer } from "@/components/CompanyLoadingErrorServer";

interface InvoicePageProps {
  params: { id: string };
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const user = await getUserFromSession();
  if (!user) redirect("/login?redirect=/dashboard/wholesale/invoices");

  const result = await getCurrentUserAndCompany();
  const { companyId } = result;

  if (!companyId) {
    return <CompanyLoadingErrorServer result={result} page="wholesale-invoice-detail" />;
  }

  const invoiceId = parseInt(params.id, 10);

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
    redirect("/dashboard/wholesale/invoices");
  }

  const serialised = JSON.parse(JSON.stringify(invoice));

  return (
    <div className="p-6">
      <InvoiceDetailClient invoice={serialised} />
    </div>
  );
}
