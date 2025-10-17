import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function ShortUrlRedirect({ params }: PageProps) {
  const { code } = await params;

  // Look up the customer by short code
  const customer = await prisma.wholesaleCustomer.findUnique({
    where: { portalShortCode: code },
    select: {
      portalToken: true,
      portalEnabled: true,
      name: true,
    },
  });

  // If customer not found or portal disabled, show error
  if (!customer || !customer.portalToken || !customer.portalEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center app-container max-w-md mx-auto p-6">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600">
            {!customer 
              ? "This ordering link is not valid or has expired." 
              : "Portal access is disabled for this customer."}
          </p>
        </div>
      </div>
    );
  }

  // Redirect to the full portal URL
  redirect(`/wholesale/portal/${customer.portalToken}`);
}

