/**
 * User app subscription management
 * Handles checking and managing user access to different Plato apps
 */

import { prisma } from "./prisma";
import type { App } from "./apps/types";

/**
 * Check if a user has access to a specific app
 * MVP: Only plato app exists - always return true for plato
 */
export async function hasAppAccess(userId: number, app: App): Promise<boolean> {
  // MVP: Only plato app exists - always allow access
  if (app === "plato") {
    return true;
  }

  // MVP: plato_bake removed - deny access if somehow requested
  return false;

  try {
    // Check if user has an active subscription for this app
    const subscription = await prisma.userAppSubscription.findUnique({
      where: {
        userId_app: {
          userId,
          app,
        },
      },
    });

    // MVP: Only plato app - require active subscription
    return subscription?.status === "active" || false;
  } catch (error) {
    console.error(`[hasAppAccess] Error checking access for user ${userId} to app ${app}:`, error);
    // On error, deny access
    return false;
  }
}

/**
 * Get all apps a user has access to
 */
export async function getUserApps(userId: number): Promise<App[]> {
  // MVP: Only plato app exists - always return plato
  try {
    const subscriptions = await prisma.userAppSubscription.findMany({
      where: {
        userId,
        status: "active",
        app: "plato", // MVP: Only check for plato
      },
      select: {
        app: true,
      },
    });

    const apps: App[] = subscriptions.map((sub) => sub.app);
    
    // Everyone always has access to the main plato app
    if (!apps.includes("plato")) {
      apps.unshift("plato");
    }

    // MVP: Only return plato app
    return ["plato"];
  } catch (error) {
    console.error(`[getUserApps] Error getting apps for user ${userId}:`, error);
    // Return plato on error
    return ["plato"];
  }
}

/**
 * Upsert a user app subscription (create or update)
 */
export async function upsertUserAppSubscription(
  userId: number,
  app: App,
  data: {
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    status?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
  }
) {
  try {
    return await prisma.userAppSubscription.upsert({
      where: {
        userId_app: {
          userId,
          app,
        },
      },
      create: {
        userId,
        app,
        stripeSubscriptionId: data.stripeSubscriptionId || null,
        stripePriceId: data.stripePriceId || null,
        status: data.status || "active",
        currentPeriodStart: data.currentPeriodStart || null,
        currentPeriodEnd: data.currentPeriodEnd || null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
      },
      update: {
        ...(data.stripeSubscriptionId && { stripeSubscriptionId: data.stripeSubscriptionId }),
        ...(data.stripePriceId && { stripePriceId: data.stripePriceId }),
        ...(data.status && { status: data.status }),
        ...(data.currentPeriodStart && { currentPeriodStart: data.currentPeriodStart }),
        ...(data.currentPeriodEnd && { currentPeriodEnd: data.currentPeriodEnd }),
        ...(data.cancelAtPeriodEnd !== undefined && { cancelAtPeriodEnd: data.cancelAtPeriodEnd }),
      },
    });
  } catch (error) {
    console.error(`[upsertUserAppSubscription] Error upserting subscription for user ${userId} to app ${app}:`, error);
    throw error;
  }
}

