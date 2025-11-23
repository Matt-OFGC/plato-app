import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { getUserApps } from "@/lib/user-app-subscriptions";
import { getAllApps, getAppConfig } from "@/lib/apps/registry";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userApps = await getUserApps(user.id);
    const allApps = getAllApps();
    const isDevelopment = process.env.NODE_ENV !== "production";
    
    // Return apps with their configs, marking which ones the user has access to
    // Everyone always has access to the default "plato" app
    // In development, always allow access to plato_bake
    const appsWithAccess = allApps.map(app => {
      const hasAccess = app.id === "plato" || 
                       userApps.includes(app.id) ||
                       (app.id === "plato_bake" && isDevelopment);
      
      // Log for debugging
      if (app.id === "plato_bake") {
        console.log(`[API /user/apps] plato_bake access check:`, {
          userId: user.id,
          userApps,
          isDevelopment,
          hasAccess,
        });
      }
      
      return {
        ...app,
        hasAccess,
      };
    });

    return NextResponse.json({ apps: appsWithAccess });
  } catch (error) {
    console.error("❌ User apps API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to get user apps", details: errorMessage },
      { status: 500 }
    );
  }
}
