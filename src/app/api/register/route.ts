import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { generateUniqueSlug, getCurrencyFromCountry } from "@/lib/slug";
import { sendWelcomeEmail } from "@/lib/email";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit-log";

// Password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(req, RATE_LIMITS.REGISTER);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Too many registration attempts. Please try again in ${Math.ceil(rateLimitResult.retryAfter! / 60)} minutes.` },
        { 
          status: 429,
          headers: { "Retry-After": String(rateLimitResult.retryAfter) }
        }
      );
    }

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

    // Validate password strength
    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json({ 
        error: "Password must be at least 8 characters long and contain uppercase, lowercase, and numbers" 
      }, { status: 400 });
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
  
  // Audit successful registration
  await auditLog.register(created.user.id, created.co.id, req);

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


