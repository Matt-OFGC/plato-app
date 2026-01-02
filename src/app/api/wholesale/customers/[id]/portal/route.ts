import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-simple";
import { hasCompanyAccess } from "@/lib/current";
import { randomUUID } from "crypto";

function buildPortalUrl(req: NextRequest, token: string) {
  // Prefer request origin; fallback to NEXT_PUBLIC_APP_URL if provided.
  const origin = req.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || "";
  return `${origin.replace(/\/$/, "")}/wholesale/portal/${token}`;
}

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
    select: { companyId: true },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await hasCompanyAccess(session.id, customer.companyId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const token = randomUUID();

  await prisma.wholesaleCustomer.update({
    where: { id: customerId },
    data: {
      portalToken: token,
      portalEnabled: true,
    },
  });

  return NextResponse.json({
    token,
    portalUrl: buildPortalUrl(req, token),
  });
}

export async function DELETE(
  _req: NextRequest,
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
    select: { companyId: true },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await hasCompanyAccess(session.id, customer.companyId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.wholesaleCustomer.update({
    where: { id: customerId },
    data: {
      portalToken: null,
      portalEnabled: false,
    },
  });

  return NextResponse.json({ success: true });
}

