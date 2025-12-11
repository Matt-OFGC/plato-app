import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        success: true,
        message: "If that email exists, we've sent a verification link.",
      });
    }

    // If already verified, don't send another email
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "Email is already verified.",
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiresAt = new Date();
    verificationTokenExpiresAt.setHours(verificationTokenExpiresAt.getHours() + 24); // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpiresAt,
      },
    });

    // Send verification email
    const verificationUrl = `${request.nextUrl.origin}/api/auth/verify-email?token=${verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Verify Your Email Address</h1>
          </div>
          <div class="content">
            <div class="card">
              <p>Hi ${user.name || "there"},</p>
              <p>Please verify your email address to complete your Plato account setup.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This verification link will expire in 24 hours.</p>
              <p style="color: #6b7280; font-size: 14px;">If you didn't create an account with Plato, you can safely ignore this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Verify Your Email Address

Hi ${user.name || "there"},

Please verify your email address to complete your Plato account setup.

Click the link below to verify your email:
${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with Plato, you can safely ignore this email.
    `;

    await sendEmail({
      to: user.email,
      subject: "Verify Your Plato Account",
      html,
      text,
    });

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    logger.error("Resend verification error", error, "Auth/ResendVerification");
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}


