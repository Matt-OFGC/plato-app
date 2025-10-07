import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const body = await req.text();
  const params = new URLSearchParams(body);
  const email = params.get("email");
  const password = params.get("password");
  const company = params.get("company");
  const name = params.get("name") || undefined;
  if (!email || !password || !company) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email in use" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await prisma.$transaction(async (tx) => {
    const co = await tx.company.upsert({
      where: { name: company },
      create: { name: company },
      update: {},
    });
    const user = await tx.user.create({ data: { email, name, passwordHash, preferences: { create: { currency: "GBP" } } } });
    await tx.membership.create({ data: { userId: user.id, companyId: co.id, role: "admin" } });
    return { user, co };
  });
  return NextResponse.json({ ok: true, userId: created.user.id });
}


