import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

/**
 * Test endpoint to verify email configuration
 * This endpoint can be called to test if emails are working
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get("email");
    
    if (!testEmail) {
      return NextResponse.json({
        error: "Please provide an email parameter: /api/test-email?email=your@email.com",
      }, { status: 400 });
    }

    // Check configuration
    const config = {
      hasResendApiKey: !!process.env.RESEND_API_KEY,
      resendApiKeyLength: process.env.RESEND_API_KEY?.length || 0,
      resendFromEmail: process.env.RESEND_FROM_EMAIL || 'not set',
      nodeEnv: process.env.NODE_ENV,
    };

    logger.info("Testing email configuration", config, "TestEmail");

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: "RESEND_API_KEY is not configured",
        config,
      }, { status: 500 });
    }

    // Try to send a test email
    const testSubject = "Test Email from Plato";
    const testHtml = `
      <html>
        <body>
          <h1>Test Email</h1>
          <p>This is a test email from Plato to verify email configuration.</p>
          <p>If you received this, emails are working correctly!</p>
        </body>
      </html>
    `;

    await sendEmail(testEmail, testSubject, testHtml);

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      config: {
        ...config,
        resendApiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 7) + "...",
      },
    });
  } catch (error) {
    logger.error("Test email failed", error, "TestEmail");
    
    return NextResponse.json({
      error: "Failed to send test email",
      message: error instanceof Error ? error.message : "Unknown error",
      config: {
        hasResendApiKey: !!process.env.RESEND_API_KEY,
        resendApiKeyLength: process.env.RESEND_API_KEY?.length || 0,
        resendFromEmail: process.env.RESEND_FROM_EMAIL || 'not set',
      },
    }, { status: 500 });
  }
}

