import { render } from "@react-email/render";
import { Resend } from "resend";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { TeamInviteEmail } from "@/emails/TeamInviteEmail";

// Use a dummy key during build, real key at runtime
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");

const FROM_EMAIL = process.env.EMAIL_FROM || "Plato <onboarding@plato.app>";

export async function sendWelcomeEmail(
  to: string,
  data: { name?: string; companyName: string }
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY not configured, skipping welcome email");
    return;
  }

  try {
    const emailHtml = await render(WelcomeEmail(data));

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Welcome to Plato!",
      html: emailHtml,
    });

    console.log("✅ Welcome email sent to:", to);
    return result;
  } catch (error) {
    console.error("❌ Failed to send welcome email:", error);
    throw error;
  }
}

export async function sendTeamInviteEmail(
  to: string,
  data: {
    inviterName: string;
    companyName: string;
    inviteLink: string;
    role: string;
  }
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY not configured, skipping team invite email");
    return;
  }

  try {
    const emailHtml = await render(TeamInviteEmail(data));

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `You've been invited to join ${data.companyName} on Plato`,
      html: emailHtml,
    });

    console.log("✅ Team invite email sent to:", to);
    return result;
  } catch (error) {
    console.error("❌ Failed to send team invite email:", error);
    throw error;
  }
}

export async function sendSubscriptionEmail(
  to: string,
  data: {
    name?: string;
    type: "activated" | "expired" | "renewed";
    tier: string;
  }
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY not configured, skipping subscription email");
    return;
  }

  try {
    let subject = "";
    let message = "";

    switch (data.type) {
      case "activated":
        subject = `Welcome to Plato ${data.tier}!`;
        message = `Your ${data.tier} subscription is now active.`;
        break;
      case "expired":
        subject = "Your Plato subscription has expired";
        message = "Your subscription has expired. Renew to continue using Plato.";
        break;
      case "renewed":
        subject = "Your Plato subscription has been renewed";
        message = `Your ${data.tier} subscription has been renewed.`;
        break;
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">${subject}</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Hi${data.name ? ` ${data.name}` : ""},
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            ${message}
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Go to Dashboard
            </a>
          </p>
          <p style="color: #999; font-size: 14px; margin-top: 40px;">
            Best regards,<br/>
            The Plato Team
          </p>
        </div>
      `,
    });

    console.log("✅ Subscription email sent to:", to);
    return result;
  } catch (error) {
    console.error("❌ Failed to send subscription email:", error);
    throw error;
  }
}

