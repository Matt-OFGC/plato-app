import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { generateUniqueSlug, getCurrencyFromCountry } from "@/lib/slug";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    console.log("Registration request body:", body);
    const params = new URLSearchParams(body);
    const email = params.get("email");
    const password = params.get("password");
    const company = params.get("company");
    const name = params.get("name") || undefined;
    const businessType = params.get("businessType") || undefined;
    const country = params.get("country") || "United Kingdom";
    const phone = params.get("phone") || undefined;
    
    console.log("Registration data:", { 
      email, 
      password: password ? "***" : null, 
      company, 
      name,
      businessType,
      country,
      phone 
    });
    
    if (!email || !password || !company) {
      console.log("Missing fields:", { email: !!email, password: !!password, company: !!company });
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email in use" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  
  // Generate unique slug for company
  const slug = await generateUniqueSlug(company, async (slug) => {
    const existing = await prisma.company.findUnique({ where: { slug } });
    return !!existing;
  });
  
  // Auto-detect currency from country
  const currency = getCurrencyFromCountry(country);
  
  const created = await prisma.$transaction(async (tx) => {
    const co = await tx.company.upsert({
      where: { name: company },
      create: { 
        name: company,
        slug,
        businessType,
        country,
        phone
      },
      update: {},
    });
    const user = await tx.user.create({ 
      data: { 
        email, 
        name, 
        passwordHash, 
        preferences: { 
          create: { currency } 
        } 
      } 
    });
    await tx.membership.create({ data: { userId: user.id, companyId: co.id, role: "ADMIN" } });
    return { user, co };
  });
  
  // Send welcome email
  try {
    await sendWelcomeEmail(email, {
      name: name || undefined,
      companyName: company,
    });
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (emailError) {
    console.error("❌ Failed to send welcome email:", emailError);
    // Don't fail registration if email fails
  }
  
  return NextResponse.json({ ok: true, userId: created.user.id });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


