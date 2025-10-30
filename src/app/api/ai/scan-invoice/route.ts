import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import * as pdfParse from "pdf-parse";

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
        error: "Invalid file type. Please upload JPEG, PNG, WebP images or PDF files." 
      }, { status: 400 });
    }

    // Convert file to base64 for AI processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = file.type;

    const systemPrompt = `You are an expert at analyzing invoices and receipts to extract food ingredients and their details.

IMPORTANT: You must respond with ONLY valid JSON. Do not include any explanatory text, markdown formatting, or code blocks.

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
- Skip any items that aren't clearly food ingredients
- If no ingredients are found, return: {"ingredients": []}

CRITICAL: Your response must be valid JSON only. No other text.`;

    let aiResponse;

    // Handle PDFs differently - extract text first, then analyze
    if (file.type === "application/pdf") {
      try {
        // Extract text from PDF
        const pdfData = await (pdfParse as any).default(buffer);
        const pdfText = pdfData.text;

        if (!pdfText || pdfText.trim().length === 0) {
          return NextResponse.json({ 
            error: "This PDF appears to be empty or contains only images. Please try: 1) Converting the PDF to a JPG/PNG image, or 2) Taking a screenshot of the PDF and uploading that instead.",
            suggestion: "image"
          }, { status: 400 });
        }

        // Use GPT-4o to analyze the extracted text
        aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
                content: systemPrompt
              },
              {
                role: "user",
                content: `Extract ingredients from this invoice/receipt text:\n\n${pdfText}`
              }
            ],
            max_tokens: 2000,
            temperature: 0.1
          })
        });
      } catch (pdfError: any) {
        console.error("PDF parsing error:", pdfError);
        
        // Provide helpful error message
        let errorMessage = "This PDF could not be processed. ";
        
        if (pdfError?.message?.includes("Invalid PDF")) {
          errorMessage += "The file may be corrupted or not a valid PDF. ";
        } else if (pdfError?.message?.includes("encrypted")) {
          errorMessage += "The PDF is password-protected. ";
        } else {
          errorMessage += "The PDF format is not compatible with text extraction. ";
        }
        
        errorMessage += "Please try: 1) Opening the PDF and taking a screenshot, or 2) Converting it to a JPG/PNG image using an online converter.";
        
        return NextResponse.json({ 
          error: errorMessage,
          suggestion: "image",
          details: process.env.NODE_ENV === 'development' ? pdfError?.message : undefined
        }, { status: 400 });
      }
    } else {
      // Handle images with vision API
      aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
              content: systemPrompt
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
    }

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
    const { logger } = await import("@/lib/logger");
    logger.debug("AI response data:", JSON.stringify(aiData, null, 2));
    
    const extractedText = aiData.choices[0]?.message?.content;

    if (!extractedText) {
      logger.error("No content in AI response:", aiData);
      throw new Error("No response from AI service. Please check your OpenAI API key and try again.");
    }

    // Parse the JSON response
    let parsedData;
    try {
      logger.debug("Raw AI response:", extractedText);
      
      // Clean the response text
      let cleanedText = extractedText.trim();
      
      // Remove any markdown code blocks
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON found in response:", cleanedText);
        throw new Error("No JSON found in AI response. The AI may have returned an error message instead of ingredient data.");
      }
      
      const jsonString = jsonMatch[0];
      console.log("Extracted JSON string:", jsonString);
      
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", extractedText);
      console.error("Parse error:", parseError);
      
      // Provide more helpful error message
      if (parseError instanceof SyntaxError) {
        throw new Error("AI response was not valid JSON. This might be due to the PDF being unclear or the AI service having issues. Please try taking a screenshot of the PDF instead.");
      } else {
        throw new Error("Failed to parse AI response. Please try uploading a screenshot of the PDF instead.");
      }
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
