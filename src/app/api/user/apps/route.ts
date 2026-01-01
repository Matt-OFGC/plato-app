import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { getUserApps } from "@/lib/user-app-subscriptions";
import { getAllApps, getAppConfig } from "@/lib/apps/registry";
import { logger } from "@/lib/logger";
import { createOptimizedResponse } from "@/lib/api-optimization";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userApps = await getUserApps(user.id);
    const allApps = getAllApps();
    const isDevelopment = process.env.NODE_ENV !== "production";
    
    // MVP: Only return plato app - plato_bake removed
    // Everyone always has access to the default "plato" app
    const appsWithAccess = allApps
      .filter(app => app.id === "plato") // MVP: Only show plato
      .map(app => ({
        ...app,
        hasAccess: true, // Everyone has access to plato
      }));

    return createOptimizedResponse({ apps: appsWithAccess }, {
      cacheType: 'user',
      compression: false, // Disable compression to avoid ERR_CONTENT_DECODING_FAILED
    });
  } catch (error) {
    logger.error("User apps API error", error, "User/Apps");
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to get user apps", details: errorMessage },
      { status: 500 }
    );
  }
}
