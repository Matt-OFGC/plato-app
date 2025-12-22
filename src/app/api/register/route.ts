import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { getCurrencyFromCountry } from "@/lib/slug";
import { sendWelcomeEmail, sendEmailVerificationEmail } from "@/lib/email";
import crypto from "crypto";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit-log";
import { registerSchema } from "@/lib/validation/auth";
import { mapAuthError, createAuthErrorResponse, logAuthError, generateErrorId } from "@/lib/errors/auth-errors";
import { logger } from "@/lib/logger";
import { generateDefaultCompanyName, generateCompanySlug, getDefaultCompanyData } from "@/lib/company-defaults";
import { clearUserCache } from "@/lib/current";
import { retryPrisma } from "@/lib/retry";
import { validateCompanyName, generateFallbackCompanyName } from "@/lib/validation/company";
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
    
    // Validate and sanitize company name, or generate fallback
    let company: string;
    if (companyName?.trim()) {
      const validation = validateCompanyName(companyName);
      if (validation.valid && validation.sanitized) {
        company = validation.sanitized;
      } else {
        // If validation fails, generate fallback but log warning
        logger.warn(`Company name validation failed, using fallback`, {
          email,
          originalName: companyName,
          error: validation.error,
        }, 'Registration');
        company = generateFallbackCompanyName(email);
      }
    } else {
      company = generateDefaultCompanyName(email);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, passwordHash: true, name: true }
    });
    
    // Check if user already has an active membership (idempotency check)
    // Multi-company support: users can have multiple companies
    if (existingUser) {
      const existingMemberships = await prisma.membership.findMany({
        where: {
          userId: existingUser.id,
          isActive: true
        },
        include: {
          company: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      if (existingMemberships.length > 0) {
        // User already has an account - don't allow duplicate registration
        // They should use the login page instead
        logger.warn(`User attempted to register with existing email`, {
          email,
          userId: existingUser.id,
          existingCompanies: existingMemberships.map(m => m.company.name),
        }, 'Registration');

        return NextResponse.json({
          error: "An account with this email already exists. Please sign in instead.",
          code: "USER_EXISTS",
          errorId,
          details: "If you forgot your password, use the password reset option on the login page."
        }, { status: 409 }); // 409 Conflict
      }
    }

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
      const slug = await generateCompanySlug(company);
      
      // Auto-detect currency from country
      const currency = getCurrencyFromCountry(country || 'United Kingdom');
      
      // Create new company and membership in a transaction with retry logic
      // This ensures both are created or neither is created
      const result = await retryPrisma(
        () => prisma.$transaction(async (tx) => {
        // Create company
        const co = await tx.company.create({
          data: {
            name: company,
            slug,
            businessType: businessType || null,
            country: country || 'United Kingdom',
            phone: phone || null,
            // app field removed - apps are now user-level subscriptions
          },
        });

        // Create membership with explicit isActive: true
        // User who creates account becomes ADMIN
        const membership = await tx.membership.create({ 
          data: { 
            userId: user.id, 
            companyId: co.id, 
            role: "ADMIN", // User who creates account becomes ADMIN
            isActive: true // Explicitly set to true
          } 
        });
        
        return { company: co, membership };
        }),
        { maxAttempts: 3 }
      );
      
      // Clear user cache to ensure fresh data
      await clearUserCache(user.id);
      
      logger.info(`New company created for existing user: ${email} (User ID: ${user.id}), Company: ${company} (ID: ${result.company.id}), App: ${app}`);
      
      // Audit company and membership creation
      await auditLog.companyCreated(user.id, result.company.id, company, req);
      await auditLog.membershipCreated(
        user.id,
        result.company.id,
        result.membership.id,
        result.membership.role,
        'registration_existing_user',
        req
      );
      
      return NextResponse.json({ 
        ok: true, 
        userId: user.id,
        companyId: result.company.id,
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
      const slug = await generateCompanySlug(company);
      
      // Auto-detect currency from country
      const currency = getCurrencyFromCountry(country || 'United Kingdom');
      
      // Create user, company, and membership all in a single transaction with retry logic
      // This ensures all are created or none are created
      const result = await retryPrisma(
        () => prisma.$transaction(async (tx) => {
        // Create company
        const co = await tx.company.create({
          data: {
            name: company,
            slug,
            businessType: businessType || null,
            country: country || 'United Kingdom',
            phone: phone || null,
            // app field removed - apps are now user-level subscriptions
          },
        });
        
        // Create user with free tier subscription
        const newUser = await tx.user.create({
          data: {
            email,
            name: name || null,
            passwordHash,
            verificationToken,
            verificationTokenExpiresAt,
            subscriptionTier: "free",
            subscriptionStatus: "free",
            preferences: {
              create: { currency }
            }
          }
        });
        
        // Create membership with explicit isActive: true
        // User who creates account becomes ADMIN
        const membership = await tx.membership.create({ 
          data: { 
            userId: newUser.id, 
            companyId: co.id, 
            role: "ADMIN", // User who creates account becomes ADMIN
            isActive: true // Explicitly set to true
          } 
        });
        
          return { company: co, user: newUser, membership };
        }),
        { maxAttempts: 3 }
      );
      
      user = result.user;
      
      // Clear user cache to ensure fresh data
      await clearUserCache(user.id);
      
      logger.info(`User registered successfully: ${email} (ID: ${user.id}), Company: ${company} (ID: ${result.company.id}), App: ${app}`);
      
      // Audit successful registration, company and membership creation
      await auditLog.register(user.id, result.company.id, req);
      await auditLog.companyCreated(user.id, result.company.id, company, req);
      await auditLog.membershipCreated(
        user.id,
        result.company.id,
        result.membership.id,
        result.membership.role,
        'registration_new_user',
        req
      );

      // Send verification email
      try {
        // Use production URL if available, otherwise fall back to request origin
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
        const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;
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
        companyId: result.company.id,
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
    
    // Enhanced error logging with request ID
    logger.error(`[Register API] Registration failed (Error ID: ${errorId})`, {
      error: errorMessage,
      stack: errorStack,
      errorId,
      url: req.url,
    }, 'Registration');
    
    logger.error("[Register API] Error", {
      errorMessage,
      errorStack,
      error,
      errorId,
    }, 'Registration');
    
    logAuthError(error, "registration", errorId, req);
    
    // Map to user-friendly error
    const authError = mapAuthError(error, errorId);
    
    // Provide more specific error messages
    let userFriendlyMessage = authError.message;
    if (errorMessage.includes('Unique constraint') || errorMessage.includes('duplicate')) {
      if (errorMessage.includes('email')) {
        userFriendlyMessage = "An account with this email already exists. Please sign in instead.";
      } else if (errorMessage.includes('slug')) {
        userFriendlyMessage = "This company name is already taken. Please try a different name.";
      }
    } else if (errorMessage.includes('transaction') || errorMessage.includes('rollback')) {
      userFriendlyMessage = "Registration partially failed. Please try again. If this persists, contact support.";
    }
    
    // Ensure we always return JSON, even on error
    try {
      const response = createAuthErrorResponse(authError);
      // Override message if we have a better one
      if (userFriendlyMessage !== authError.message) {
        const json = await response.json();
        json.error = userFriendlyMessage;
        return NextResponse.json(json, { status: response.status });
      }
      return response;
    } catch (responseError) {
      // Fallback if createAuthErrorResponse fails
      logger.error("[Register API] Failed to create error response", responseError, 'Registration');
      return NextResponse.json({
        error: userFriendlyMessage || errorMessage || "An unexpected error occurred during registration",
        code: "INTERNAL_ERROR",
        errorId,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      }, { status: 500 });
    }
  }
}


