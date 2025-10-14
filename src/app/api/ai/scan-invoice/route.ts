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
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Please upload JPEG, PNG, WebP, or PDF files." 
      }, { status: 400 });
    }

    // Convert file to base64 for AI processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = file.type;

    // Call AI service to extract ingredients from invoice
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
            content: `You are an expert at analyzing invoices and receipts to extract food ingredients and their details.

Extract ingredients from this invoice/receipt and return them in this exact JSON format:
{
  "ingredients": [
    {
      "name": "Ingredient Name",
      "packQuantity": 500,
      "packUnit": "g",
      "packPrice": 2.50,
      "currency": "GBP",
      "confidence": 0.95
    }
  ]
}

Rules:
- Only extract food ingredients, not cooking equipment or supplies
- packQuantity should be the package size (e.g., 500 for 500g bag)
- packUnit should be the package unit (g, kg, ml, l, each, slices)
- packPrice should be the total price for that package
- currency should be GBP, USD, or EUR based on the invoice
- confidence should be 0-1 based on how clear the text is
- If quantity/price is unclear, make your best estimate
- Skip any items that aren't clearly food ingredients`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract ingredients from this invoice/receipt:"
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
        max_tokens: 2000,
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
      console.error("Failed to parse AI response:", extractedText);
      throw new Error("Failed to parse AI response");
    }

    // Validate and clean the extracted ingredients
    const validIngredients = parsedData.ingredients?.filter((ing: any) => 
      ing.name && 
      typeof ing.packQuantity === 'number' && 
      ing.packQuantity > 0 &&
      ing.packUnit &&
      typeof ing.packPrice === 'number' && 
      ing.packPrice > 0
    ) || [];

    return NextResponse.json({
      success: true,
      ingredients: validIngredients,
      message: `Successfully extracted ${validIngredients.length} ingredients from invoice`
    });

  } catch (error) {
    console.error("Invoice scan error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to scan invoice",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
