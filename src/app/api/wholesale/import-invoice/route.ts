import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/auth/currentUser";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    await getCurrentUserAndCompany();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert file to base64 for OpenAI Vision API
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type;

    // Determine if it's a PDF or image
    const isPDF = mimeType === "application/pdf";
    const dataUrl = isPDF
      ? `data:application/pdf;base64,${base64}`
      : `data:${mimeType};base64,${base64}`;

    // Use OpenAI Vision API to extract invoice data
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an invoice data extraction assistant. Extract the following information from this invoice image/PDF:

1. Customer name (the person/company being invoiced)
2. Invoice number
3. Invoice date (in YYYY-MM-DD format)
4. Due date (in YYYY-MM-DD format, if not present, calculate 30 days from invoice date)
5. Line items (description, quantity, unit price, total for each item)
6. Subtotal
7. Tax amount (if any)
8. Total amount
9. Any notes or payment terms

Return the data in the following JSON format:
{
  "customerName": "Customer Name",
  "invoiceNumber": "INV-001",
  "invoiceDate": "2024-01-01",
  "dueDate": "2024-01-31",
  "items": [
    {
      "description": "Product/Service Name",
      "quantity": 1,
      "unitPrice": 10.00,
      "total": 10.00
    }
  ],
  "subtotal": 10.00,
  "tax": 2.00,
  "total": 12.00,
  "notes": "Payment terms or other notes"
}

IMPORTANT:
- Return ONLY valid JSON, no markdown code blocks or extra text
- All prices should be numbers, not strings
- Dates must be in YYYY-MM-DD format
- If a field is not found, use null or an empty string
- Extract ALL line items from the invoice
`,
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const extractedText = response.choices[0]?.message?.content || "";

    // Parse the JSON response
    let extractedData;
    try {
      // Remove markdown code blocks if present
      const jsonText = extractedText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      extractedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", extractedText);
      return NextResponse.json(
        { error: "Failed to parse invoice data. Please try again or enter manually." },
        { status: 500 }
      );
    }

    // Validate and format the extracted data
    const formattedData = {
      customerName: extractedData.customerName || "",
      invoiceNumber: extractedData.invoiceNumber || "",
      invoiceDate: extractedData.invoiceDate || new Date().toISOString().split("T")[0],
      dueDate: extractedData.dueDate || "",
      items: (extractedData.items || []).map((item: any) => ({
        description: item.description || "",
        quantity: parseFloat(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
        total: parseFloat(item.total) || 0,
      })),
      subtotal: parseFloat(extractedData.subtotal) || 0,
      tax: parseFloat(extractedData.tax) || 0,
      total: parseFloat(extractedData.total) || 0,
      notes: extractedData.notes || "",
    };

    return NextResponse.json({
      success: true,
      extractedData: formattedData,
    });
  } catch (error: any) {
    console.error("Invoice extraction error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract invoice data" },
      { status: 500 }
    );
  }
}
