/**
 * User app subscription management
 * Handles checking and managing user access to different Plato apps
 */

import { prisma } from "./prisma";
import type { App } from "./apps/types";

/**
 * Check if a user has access to a specific app
 * For now, allow access to plato_bake for all users (development mode)
 * TODO: Implement proper subscription checking
 */
export async function hasAppAccess(userId: number, app: App): Promise<boolean> {
  // Always allow access to main plato app
  if (app === "plato") {
    return true;
  }

  // For development: always allow access to plato_bake
  // Also allow access for specific test accounts
  if (app === "plato_bake") {
    // In development, always return true immediately (skip database check)
    const isDevelopment = process.env.NODE_ENV !== "production";
    if (isDevelopment) {
      console.log(`[hasAppAccess] Development mode: allowing access to plato_bake for user ${userId}`);
      return true;
    }
    
    // Check if this is a test account (matt@ofgc.uk)
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      
      // Allow access for matt@ofgc.uk for testing
      if (user?.email === "matt@ofgc.uk") {
        console.log(`[hasAppAccess] Allowing access to plato_bake for test account: ${user.email}`);
        return true;
      }
    } catch (error) {
      // If we can't check email, continue with normal flow
      console.error(`[hasAppAccess] Error checking user email:`, error);
    }
  }

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

    // For plato_bake: if no subscription exists, allow in development
    if (app === "plato_bake") {
      if (!subscription) {
        return process.env.NODE_ENV !== "production";
      }
      // If subscription exists, check if it's active
      return subscription.status === "active";
    }

    // For other apps, require active subscription
    return subscription?.status === "active" || false;
  } catch (error) {
    console.error(`[hasAppAccess] Error checking access for user ${userId} to app ${app}:`, error);
    // On error, allow access in development, deny in production
    // Especially for plato_bake, always allow in development
    if (app === "plato_bake") {
      return process.env.NODE_ENV !== "production";
    }
    return process.env.NODE_ENV !== "production";
  }
}

/**
 * Get all apps a user has access to
 */
export async function getUserApps(userId: number): Promise<App[]> {
  // For development: always return both apps
  // TODO: In production, check actual subscriptions
  const defaultApps: App[] = ["plato", "plato_bake"];
  
  try {
    const subscriptions = await prisma.userAppSubscription.findMany({
      where: {
        userId,
        status: "active",
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

    // For development: always include plato_bake regardless of subscription
    // This ensures users can access Plato Bake during development
    if (!apps.includes("plato_bake")) {
      apps.push("plato_bake");
    }

    // In development, always return both apps
    // In production, only return apps user actually has subscriptions for
    if (process.env.NODE_ENV !== "production") {
      return defaultApps;
    }

    return apps;
  } catch (error) {
    console.error(`[getUserApps] Error getting apps for user ${userId}:`, error);
    // Return default apps on error (always allow in development)
    return defaultApps;
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

