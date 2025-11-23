import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { generateUniqueSlug, getCurrencyFromCountry } from "@/lib/slug";
import { sendWelcomeEmail, sendEmailVerificationEmail } from "@/lib/email";
import crypto from "crypto";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit-log";
import { registerSchema } from "@/lib/validation/auth";
import { mapAuthError, createAuthErrorResponse, logAuthError, generateErrorId } from "@/lib/errors/auth-errors";
import { logger } from "@/lib/logger";
// Temporarily disabled to fix build error
// import { initializeRecipesTrial } from "@/lib/features";

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
      companyName: params.get("company") || params.get("companyName"), // Support both 'company' and 'companyName'
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
    
    const { email, password, companyName, name, businessType, country, phone } = validationResult.data;
    const company = companyName; // Use companyName from validated data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, passwordHash: true, name: true }
    });

    // Detect app from form parameter, referer header, or route path
    const appParam = params.get("app");
    const referer = req.headers.get('referer') || '';
    const pathname = req.nextUrl.pathname;
    const app: 'plato' | 'plato_bake' = appParam === 'plato_bake' || referer.includes('/bake/') || pathname.includes('/bake/') ? 'plato_bake' : 'plato';

    let user;
    
    if (existingUser) {
      // User exists - verify password and create new company
      const isValidPassword = await bcrypt.compare(password, existingUser.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json({
          error: "Invalid password. If you want to create a new company, please use the correct password for this email.",
          code: "INVALID_PASSWORD",
          errorId
        }, { status: 401 });
      }
      
      user = existingUser;
      
      // Generate unique slug for company
      const slug = await generateUniqueSlug(company, async (slug) => {
        const existing = await prisma.company.findUnique({ where: { slug } });
        return !!existing;
      });
      
      // Auto-detect currency from country
      const currency = getCurrencyFromCountry(country);
      
      // Create new company and membership
      const co = await prisma.company.create({
        data: {
          name: company,
          slug,
          businessType,
          country,
          phone,
          // app field removed - apps are now user-level subscriptions
        },
      });

      await prisma.membership.create({ data: { userId: user.id, companyId: co.id, role: "OWNER" } });
      
      logger.info(`New company created for existing user: ${email} (User ID: ${user.id}), Company: ${company} (ID: ${co.id}), App: ${app}`);
      
      // Audit company creation
      await auditLog.register(user.id, co.id, req);
      
      return NextResponse.json({ 
        ok: true, 
        userId: user.id,
        companyId: co.id,
        message: `New ${app === 'plato_bake' ? 'Plato Bake' : 'Plato'} company created successfully! You can now sign in.`
      });
    } else {
      // New user - create user and company
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpiresAt = new Date();
      verificationTokenExpiresAt.setHours(verificationTokenExpiresAt.getHours() + 24); // 24 hours
      
      // Generate unique slug for company
      const slug = await generateUniqueSlug(company, async (slug) => {
        const existing = await prisma.company.findUnique({ where: { slug } });
        return !!existing;
      });
      
      // Auto-detect currency from country
      const currency = getCurrencyFromCountry(country);
      
      const [co, newUser] = await prisma.$transaction([
        prisma.company.create({
          data: {
            name: company,
            slug,
            businessType,
            country,
            phone,
            // app field removed - apps are now user-level subscriptions
          },
        }),
        prisma.user.create({
          data: {
            email,
            name,
            passwordHash,
            verificationToken,
            verificationTokenExpiresAt,
            preferences: {
              create: { currency }
            }
          }
        })
      ]);

      await prisma.membership.create({ data: { userId: newUser.id, companyId: co.id, role: "OWNER" } });
      
      user = newUser;
      
      logger.info(`User registered successfully: ${email} (ID: ${user.id}), Company: ${company} (ID: ${co.id}), App: ${app}`);
      
      // Audit successful registration
      await auditLog.register(user.id, co.id, req);

      // Send verification email
      try {
        const verificationUrl = `${req.nextUrl.origin}/api/auth/verify-email?token=${verificationToken}`;
        await sendEmailVerificationEmail({
          to: email,
          name: name || "there",
          verificationToken,
          verificationUrl,
        });
        logger.debug(`Verification email sent to ${email}`);
      } catch (emailError) {
        logger.error("Failed to send verification email:", emailError);
        // Don't fail registration if email fails
      }
      
      // Send welcome email (after verification email)
      try {
        await sendWelcomeEmail({
          email,
          name: name || "there",
        });
        logger.debug(`Welcome email sent to ${email}`);
      } catch (emailError) {
        logger.error("Failed to send welcome email:", emailError);
        // Don't fail registration if email fails
      }
      
      return NextResponse.json({ 
        ok: true, 
        userId: user.id,
        companyId: co.id,
        message: "Account created successfully! You can now sign in."
      });
    }
    
    // Temporarily disabled to fix build error
    // Initialize Recipes trial for new user
    // try {
    //   await initializeRecipesTrial(user.id);
    //   logger.debug(`Recipes trial initialized for user ${user.id}`);
    // } catch (trialError) {
    //   logger.error("Failed to initialize Recipes trial:", trialError);
    //   // Don't fail registration if trial init fails
    // }
    
  } catch (error) {
    // Log the full error for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[Register API] Error:", errorMessage);
    console.error("[Register API] Stack:", errorStack);
    console.error("[Register API] Full error:", error);
    
    logAuthError(error, "registration", errorId, req);
    
    // Map to user-friendly error
    const authError = mapAuthError(error, errorId);
    
    // Ensure we always return JSON, even on error
    try {
      return createAuthErrorResponse(authError);
    } catch (responseError) {
      // Fallback if createAuthErrorResponse fails
      console.error("[Register API] Failed to create error response:", responseError);
      return NextResponse.json({
        error: errorMessage || "An unexpected error occurred during registration",
        code: "INTERNAL_ERROR",
        errorId,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      }, { status: 500 });
    }
  }
}


