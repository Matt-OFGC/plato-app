import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/email";

interface DeviceInfo {
  userAgent: string;
  ipAddress: string;
  deviceInfo?: string;
}

/**
 * Parse user agent to extract browser and OS information
 */
function parseUserAgent(userAgent: string): { browser: string; os: string; device: string } {
  const ua = userAgent.toLowerCase();

  // Browser detection
  let browser = "Unknown Browser";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome/")) browser = "Chrome";
  else if (ua.includes("safari/") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("firefox/")) browser = "Firefox";
  else if (ua.includes("opera/") || ua.includes("opr/")) browser = "Opera";

  // OS detection
  let os = "Unknown OS";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os x")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  // Device type
  let device = "Desktop";
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    device = "Mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    device = "Tablet";
  }

  return { browser, os, device };
}

/**
 * Get approximate location from IP address
 * In production, you'd use a proper geolocation service
 */
async function getLocationFromIP(ipAddress: string): Promise<string> {
  // For now, just return "Unknown location"
  // In production, integrate with a service like ipapi.co or MaxMind
  if (ipAddress === "unknown" || ipAddress === "127.0.0.1" || ipAddress === "::1") {
    return "Local/Development";
  }

  try {
    // Simple placeholder - in production, use proper geolocation API
    return "Unknown location";
  } catch (error) {
    return "Unknown location";
  }
}

/**
 * Check if this is a new device login
 */
export async function isNewDeviceLogin(
  userId: number,
  currentDevice: DeviceInfo
): Promise<boolean> {
  try {
    // Get all active sessions for this user from the last 90 days
    const recentSessions = await prisma.session.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
      select: {
        userAgent: true,
        ipAddress: true,
        deviceInfo: true,
      },
    });

    // If no previous sessions, this is definitely a new device
    if (recentSessions.length === 0) {
      return true;
    }

    // Check if any previous session matches this device
    const currentUA = parseUserAgent(currentDevice.userAgent);

    for (const session of recentSessions) {
      if (!session.userAgent) continue;

      const sessionUA = parseUserAgent(session.userAgent);

      // Match if browser, OS, and IP are similar
      const sameIP = session.ipAddress === currentDevice.ipAddress;
      const sameBrowser = sessionUA.browser === currentUA.browser;
      const sameOS = sessionUA.os === currentUA.os;

      // Consider it the same device if 2 out of 3 match
      const matches = [sameIP, sameBrowser, sameOS].filter(Boolean).length;

      if (matches >= 2) {
        return false; // Not a new device
      }
    }

    return true; // No matching device found - this is new
  } catch (error) {
    logger.error("Error checking for new device login", error, "LoginNotification");
    // Fail open - don't block login if check fails
    return false;
  }
}

/**
 * Send new device login notification email
 */
export async function sendNewDeviceNotification(
  userId: number,
  email: string,
  deviceInfo: DeviceInfo
): Promise<void> {
  try {
    const { browser, os, device } = parseUserAgent(deviceInfo.userAgent);
    const location = await getLocationFromIP(deviceInfo.ipAddress);
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const subject = "New login to your Plato account";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">New Login Detected</h2>

        <p>Hi there,</p>

        <p>We detected a new login to your Plato account:</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Device:</strong> ${device}</p>
          <p style="margin: 5px 0;"><strong>Browser:</strong> ${browser}</p>
          <p style="margin: 5px 0;"><strong>Operating System:</strong> ${os}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${timestamp}</p>
          <p style="margin: 5px 0; font-size: 12px; color: #6b7280;"><strong>IP Address:</strong> ${deviceInfo.ipAddress}</p>
        </div>

        <p><strong>Was this you?</strong></p>

        <p>If you recognize this login, you can safely ignore this email.</p>

        <p>If you don't recognize this activity, please secure your account immediately:</p>

        <ol>
          <li>Change your password: <a href="${process.env.NEXT_PUBLIC_APP_URL}/forgot-password" style="color: #0d9488;">Reset Password</a></li>
          <li>Review your active sessions: <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/security" style="color: #0d9488;">Security Settings</a></li>
          <li>Contact support if you need help: support@getplato.uk</li>
        </ol>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          This is an automated security notification from Plato. For your security, we notify you whenever there's a login from a new device.
        </p>
      </div>
    `;

    const text = `
New Login Detected

Hi there,

We detected a new login to your Plato account:

Device: ${device}
Browser: ${browser}
Operating System: ${os}
Location: ${location}
Time: ${timestamp}
IP Address: ${deviceInfo.ipAddress}

Was this you?

If you recognize this login, you can safely ignore this email.

If you don't recognize this activity, please secure your account immediately:

1. Change your password: ${process.env.NEXT_PUBLIC_APP_URL}/forgot-password
2. Review your active sessions: ${process.env.NEXT_PUBLIC_APP_URL}/settings/security
3. Contact support if you need help: support@getplato.uk

This is an automated security notification from Plato.
    `;

    await sendEmail({
      to: email,
      subject,
      html,
      text,
    });

    logger.info(`New device login notification sent to user ${userId}`, {
      userId,
      device,
      browser,
      os,
    }, "LoginNotification");
  } catch (error) {
    logger.error("Failed to send new device notification", error, "LoginNotification");
    // Don't throw - email failure shouldn't block login
  }
}

/**
 * Handle login notification logic
 * Call this after successful login
 */
export async function handleLoginNotification(
  userId: number,
  email: string,
  deviceInfo: DeviceInfo
): Promise<void> {
  try {
    const isNewDevice = await isNewDeviceLogin(userId, deviceInfo);

    if (isNewDevice) {
      // Send notification asynchronously (don't block login)
      sendNewDeviceNotification(userId, email, deviceInfo).catch((error) => {
        logger.error("Background notification failed", error, "LoginNotification");
      });
    }
  } catch (error) {
    logger.error("Login notification handler error", error, "LoginNotification");
    // Don't throw - notification failures shouldn't break login
  }
}
