import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";

export async function POST(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Please upload JPEG, PNG, or WebP images." 
      }, { status: 400 });
    }

    // Convert file to base64 for AI processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = file.type;

    // Call AI service to extract recipes from menu
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert at analyzing menu photos to extract recipes and their details.

Extract recipes from this menu photo and return them in this exact JSON format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief description of the dish",
      "price": 12.50,
      "currency": "GBP",
      "category": "Desserts",
      "estimatedIngredients": [
        "Flour",
        "Sugar", 
        "Butter",
        "Eggs"
      ],
      "confidence": 0.90
    }
  ]
}

Rules:
- Extract all food items/dishes from the menu
- name should be the dish name as written on the menu
- description should be a brief description of what the dish is
- price should be the price if visible, or null if not shown
- currency should be GBP, USD, or EUR based on the menu
- category should be one of: "Appetizers", "Mains", "Desserts", "Beverages", "Sides", "Salads", "Soups"
- estimatedIngredients should be a list of likely main ingredients (4-8 items)
- confidence should be 0-1 based on how clear the text is
- Skip any items that aren't clearly food dishes`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract recipes from this menu photo:"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 3000,
        temperature: 0.1
      })
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.json().catch(() => ({}));
      
      if (aiResponse.status === 429) {
        throw new Error("Rate limit reached. Please wait a moment and try again, or check your OpenAI account has credits/billing set up.");
      } else if (aiResponse.status === 401) {
        throw new Error("OpenAI API key is invalid. Please check your OPENAI_API_KEY environment variable.");
      } else {
        throw new Error(`AI service error: ${aiResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
    }

    const aiData = await aiResponse.json();
    const extractedText = aiData.choices[0]?.message?.content;

    if (!extractedText) {
      throw new Error("No response from AI service");
    }

    // Parse the JSON response
    let parsedData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      const { logger } = await import("@/lib/logger");
      logger.error("Failed to parse AI response:", extractedText);
      throw new Error("Failed to parse AI response");
    }

    // Validate and clean the extracted recipes
    const validRecipes = parsedData.recipes?.filter((recipe: any) => 
      recipe.name && 
      recipe.name.trim().length > 0 &&
      recipe.estimatedIngredients &&
      Array.isArray(recipe.estimatedIngredients) &&
      recipe.estimatedIngredients.length > 0
    ) || [];

    return NextResponse.json({
      success: true,
      recipes: validRecipes,
      message: `Successfully extracted ${validRecipes.length} recipes from menu`
    });

  } catch (error) {
    const { logger } = await import("@/lib/logger");
    logger.error("Menu scan error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to scan menu",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
