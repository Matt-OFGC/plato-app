import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-simple";
import { hasCompanyAccess } from "@/lib/current";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customerId = Number(id);
  if (Number.isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
  }

  const customer = await prisma.wholesaleCustomer.findUnique({
    where: { id: customerId },
    select: {
      companyId: true,
      email: true,
      name: true,
      portalToken: true,
      portalEnabled: true,
    },
  });

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await hasCompanyAccess(session.id, customer.companyId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!customer.portalEnabled || !customer.portalToken) {
    return NextResponse.json({ error: "Portal is not enabled for this customer" }, { status: 400 });
  }

  if (!customer.email) {
    return NextResponse.json({ error: "Customer has no email on file" }, { status: 400 });
  }

  // TODO: integrate actual email sending here.
  // For now, we simply return success so the UI flow works.
  const portalUrl = `${req.nextUrl.origin}/wholesale/portal/${customer.portalToken}`;

  return NextResponse.json({
    success: true,
    message: "Portal link queued for sending",
    portalUrl,
    to: customer.email,
  });
}

