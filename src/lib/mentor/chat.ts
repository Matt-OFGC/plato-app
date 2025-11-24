/**
 * Mentor chat handler
 * Handles chat interactions with the AI assistant
 */

import { prisma } from "@/lib/prisma";
import { retrieveBusinessContext, formatContextForPrompt } from "./context-retrieval";
import { searchWeb, formatWebSearchResults } from "./web-search";
import { getMentorConfig } from "./config";
import { logger } from "@/lib/logger";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Generate AI response for a chat message
 */
export async function generateChatResponse(
  companyId: number,
  userId: number,
  conversationId: number,
  message: string
): Promise<{
  response: string;
  tokensUsed: number;
  dataSourcesUsed: string[];
}> {
  try {
    // Get conversation history
    const conversation = await prisma.mentorConversation.findUnique({
      where: { id: conversationId },
      include: {
        MentorMessage: {
          orderBy: { createdAt: "asc" },
          take: 10, // Last 10 messages for context
        },
      },
    });

    if (!conversation || conversation.companyId !== companyId) {
      throw new Error("Conversation not found or access denied");
    }

    // Get company config
    const config = await getMentorConfig(companyId);

    // Retrieve relevant business context
    const context = await retrieveBusinessContext(companyId, message, 10);
    const contextText = formatContextForPrompt(context);
    const dataSourcesUsed = Object.keys(context).filter(
      (key) => context[key as keyof typeof context]?.length > 0
    );

    // Perform web search if enabled
    let webSearchResults = "";
    if (config.enableInternetSearch) {
      const webResults = await searchWeb(message, 3);
      webSearchResults = formatWebSearchResults(webResults);
    }

    // Build conversation history
    const conversationHistory = conversation.MentorMessage.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Build system prompt
    const systemPrompt = `You are Mentor, a helpful AI business assistant for a food business. You have access to the business's data and can provide advice on pricing, operations, compliance, and more. Be concise, helpful, and professional.

Business Context:
${contextText}

${webSearchResults ? `\n${webSearchResults}` : ""}

Remember:
- Only use data from this specific business (company ID: ${companyId})
- Provide actionable advice based on the business data
- If you don't have enough information, say so
- Be specific and reference actual data when possible`;

    // Call OpenAI API
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    const response = await callOpenAI(messages);

    // Calculate tokens (rough estimate)
    const tokensUsed = estimateTokens(JSON.stringify(messages) + response);

    return {
      response,
      tokensUsed,
      dataSourcesUsed,
    };
  } catch (error) {
    logger.error("Error generating chat response", error, "Mentor/Chat");
    throw error;
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
  } catch (error) {
    logger.error("Error calling OpenAI API", error, "Mentor/OpenAI");
    throw error;
  }
}

/**
 * Rough token estimation (4 characters ≈ 1 token)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

