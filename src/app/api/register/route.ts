import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { generateUniqueSlug, getCurrencyFromCountry } from "@/lib/slug";
import { sendWelcomeEmail } from "@/lib/email";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit-log";
import { registerSchema } from "@/lib/validation/auth";
import { mapAuthError, createAuthErrorResponse, logAuthError, generateErrorId } from "@/lib/errors/auth-errors";

export async function POST(req: NextRequest) {
  const errorId = generateErrorId();
  
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(req, RATE_LIMITS.REGISTER);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: `Too many registration attempts. Please try again in ${Math.ceil(rateLimitResult.retryAfter! / 60)} minutes.`,
          code: "RATE_LIMITED",
          errorId
        },
        { 
          status: 429,
          headers: { "Retry-After": String(rateLimitResult.retryAfter) }
        }
      );
    }

    const body = await req.text();
    const params = new URLSearchParams(body);
    
    // Parse and validate input data
    const rawData = {
      email: params.get("email"),
      password: params.get("password"),
      company: params.get("company"),
      name: params.get("name") || undefined,
      businessType: params.get("businessType") || undefined,
      country: params.get("country") || "United Kingdom",
      phone: params.get("phone") || undefined,
    };
    
    // Validate using Zod schema
    const validationResult = registerSchema.safeParse(rawData);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return NextResponse.json({
        error: firstError.message,
        code: "VALIDATION_ERROR",
        errorId,
        field: firstError.path[0]
      }, { status: 400 });
    }
    
    const { email, password, company, name, businessType, country, phone } = validationResult.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        error: "That email is already registered. Try logging in or reset your password.",
        code: "EMAIL_ALREADY_EXISTS",
        errorId
      }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate unique slug for company
    const slug = await generateUniqueSlug(company, async (slug) => {
      const existing = await prisma.company.findUnique({ where: { slug } });
      return !!existing;
    });
    
    // Auto-detect currency from country
    const currency = getCurrencyFromCountry(country);
    
    const [co, user] = await prisma.$transaction([
      prisma.company.create({
        data: {
          name: company,
          slug,
          businessType,
          country,
          phone
        },
      }),
      prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          preferences: {
            create: { currency }
          }
        }
      })
    ]);

    await prisma.membership.create({ data: { userId: user.id, companyId: co.id, role: "OWNER" } });
    
    // Audit successful registration
    await auditLog.register(user.id, co.id, req);

    // Send welcome email
    try {
      await sendWelcomeEmail({
        to: email,
        name: name || "there",
        companyName: company,
      });
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Welcome email sent to ${email}`);
      }
    } catch (emailError) {
      console.error("❌ Failed to send welcome email:", emailError);
      // Don't fail registration if email fails
    }
    
    return NextResponse.json({ 
      ok: true, 
      userId: user.id,
      message: "Account created successfully! You can now sign in."
    });
    
  } catch (error) {
    // Log the full error for debugging
    logAuthError(error, "registration", errorId, req);
    
    // Map to user-friendly error
    const authError = mapAuthError(error, errorId);
    return createAuthErrorResponse(authError);
  }
}


