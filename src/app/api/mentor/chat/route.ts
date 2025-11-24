import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { generateChatResponse } from "@/lib/mentor/chat";
import { canUseAI } from "@/lib/subscription-simple";
import { logger } from "@/lib/logger";
import { createOptimizedResponse } from "@/lib/api-optimization";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, message } = body;

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: "conversationId and message are required" },
        { status: 400 }
      );
    }

    // OPTIMIZATION: Get membership, conversation, and subscription check in parallel
    const [membership, conversation] = await Promise.all([
      prisma.membership.findFirst({
        where: {
          userId: session.id,
          isActive: true,
        },
        include: {
          company: true,
        },
      }),
      prisma.mentorConversation.findUnique({
        where: { id: conversationId },
      }),
    ]);

    if (!membership || !membership.company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const companyId = membership.company.id;

    if (!conversation || conversation.companyId !== companyId) {
      return NextResponse.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      );
    }

    // Check if user can use AI (must be ADMIN role AND company must have AI subscription)
    const canUse = await canUseAI(session.id, companyId);
    const isDev = process.env.NODE_ENV !== "production";
    const isMVP = process.env.MVP_MODE === "true" || process.env.NEXT_PUBLIC_MVP_MODE === "true";
    
    // Hide Mentor in MVP mode
    if (isMVP) {
      return NextResponse.json(
        { error: "Mentor AI is not available in MVP mode" },
        { status: 403 }
      );
    }
    
    if (!canUse && !isDev) {
      // canUseAI() already checks both role (ADMIN/OWNER) and subscription
      // If it returns false, either role is wrong or subscription is missing
      return NextResponse.json(
        { error: "AI Assistant access requires ADMIN role and an active AI subscription" },
        { status: 403 }
      );
    }

    // Save user message
    await prisma.mentorMessage.create({
      data: {
        conversationId,
        role: "user",
        content: message,
      },
    });

    // Generate AI response
    const { response, tokensUsed, dataSourcesUsed } = await generateChatResponse(
      companyId,
      session.id,
      conversationId,
      message
    );

    // OPTIMIZATION: Save assistant message and update conversation in parallel using transaction
    const [assistantMessage] = await prisma.$transaction([
      prisma.mentorMessage.create({
        data: {
          conversationId,
          role: "assistant",
          content: response,
          tokensUsed,
          metadata: {
            dataSourcesUsed,
          },
        },
      }),
      prisma.mentorConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    // Use optimized response with compression
    return createOptimizedResponse(
      {
        message: assistantMessage,
        tokensUsed,
        dataSourcesUsed,
      },
      {
        cacheType: 'noCache', // Chat responses shouldn't be cached
        compression: true,
      }
    );
  } catch (error) {
    logger.error("Failed to process chat message", error, "Mentor/Chat");
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

/**
 * Create a new conversation
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title } = body;

    // Get user's company
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.id,
        isActive: true,
      },
      include: {
        company: true,
      },
    });

    if (!membership || !membership.company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const companyId = membership.company.id;

    // Check if user can use AI (must be ADMIN role AND company must have AI subscription)
    const canUse = await canUseAI(session.id, companyId);
    const isDev = process.env.NODE_ENV !== "production";
    const isMVP = process.env.MVP_MODE === "true" || process.env.NEXT_PUBLIC_MVP_MODE === "true";
    
    // Hide Mentor in MVP mode
    if (isMVP) {
      return NextResponse.json(
        { error: "Mentor AI is not available in MVP mode" },
        { status: 403 }
      );
    }
    
    if (!canUse && !isDev) {
      // canUseAI() already checks both role (ADMIN/OWNER) and subscription
      // If it returns false, either role is wrong or subscription is missing
      return NextResponse.json(
        { error: "AI Assistant access requires ADMIN role and an active AI subscription" },
        { status: 403 }
      );
    }

    // Create new conversation
    const conversation = await prisma.mentorConversation.create({
      data: {
        companyId,
        userId: session.id,
        title: title || null,
      },
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    logger.error("Failed to create conversation", error, "Mentor/Chat");
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}

/**
 * Get conversation history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    // Get user's company
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.id,
        isActive: true,
      },
      include: {
        company: true,
      },
    });

    if (!membership || !membership.company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const companyId = membership.company.id;

    // Check if user can use AI (must be ADMIN role AND company must have AI subscription)
    const canUse = await canUseAI(session.id, companyId);
    const isDev = process.env.NODE_ENV !== "production";
    const isMVP = process.env.MVP_MODE === "true" || process.env.NEXT_PUBLIC_MVP_MODE === "true";
    
    // Hide Mentor in MVP mode
    if (isMVP) {
      return NextResponse.json(
        { error: "Mentor AI is not available in MVP mode" },
        { status: 403 }
      );
    }
    
    if (!canUse && !isDev) {
      // canUseAI() already checks both role (ADMIN/OWNER) and subscription
      // If it returns false, either role is wrong or subscription is missing
      return NextResponse.json(
        { error: "AI Assistant access requires ADMIN role and an active AI subscription" },
        { status: 403 }
      );
    }

    if (conversationId) {
      // Get specific conversation with messages
      const conversation = await prisma.mentorConversation.findUnique({
        where: { id: parseInt(conversationId) },
        include: {
          MentorMessage: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!conversation || conversation.companyId !== companyId) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ conversation });
    } else {
      // Get all conversations for company
      const conversations = await prisma.mentorConversation.findMany({
        where: {
          companyId,
          userId: session.id,
          isArchived: false,
        },
        orderBy: { updatedAt: "desc" },
        include: {
          MentorMessage: {
            orderBy: { createdAt: "desc" },
            take: 1, // Just get last message for preview
          },
        },
      });

      return NextResponse.json({ conversations });
    }
  } catch (error) {
    logger.error("Failed to fetch conversations", error, "Mentor/Chat");
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

