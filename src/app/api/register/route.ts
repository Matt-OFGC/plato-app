import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    console.log("Registration request body:", body);
    const params = new URLSearchParams(body);
    const email = params.get("email");
    const password = params.get("password");
    const company = params.get("company");
    const name = params.get("name") || undefined;
    
    console.log("Registration data:", { email, password: password ? "***" : null, company, name });
    
    if (!email || !password || !company) {
      console.log("Missing fields:", { email: !!email, password: !!password, company: !!company });
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

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
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


