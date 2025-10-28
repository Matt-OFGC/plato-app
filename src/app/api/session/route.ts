import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getAvailableApps } from "@/src/lib/plato-apps-config";

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ user: null, company: null });
    }

    // Fetch user's company information
    const membership = await prisma.membership.findFirst({
      where: { 
        userId: session.id,
        isActive: true 
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            businessType: true,
            country: true,
            phone: true,
            logoUrl: true
          }
        }
      },
      orderBy: { createdAt: 'asc' } // Get the first company they joined
    });

    // Get available apps based on user's subscription tier
    const availableApps = getAvailableApps(session.subscriptionTier || 'starter');

    return NextResponse.json({ 
      user: session,
      company: membership?.company || null,
      availableApps: availableApps.map(app => ({
        id: app.id,
        name: app.name,
        shortName: app.shortName,
        route: app.route,
        requiredTier: app.requiredTier,
        isCore: app.isCore
      }))
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ user: null, company: null });
  }
}

