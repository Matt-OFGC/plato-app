import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

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

    return NextResponse.json({ 
      user: session,
      company: membership?.company || null,
    });
  } catch (error) {
    logger.error("Session error", error, "Session");
    return NextResponse.json({ user: null, company: null });
  }
}

