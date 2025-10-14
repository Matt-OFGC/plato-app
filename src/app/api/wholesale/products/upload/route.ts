import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

/**
 * Upload and parse Excel/CSV file for bulk product import
 * 
 * Expected CSV format:
 * name,description,unit,price,category,isActive
 * Product 1,Description,per box,10.50,Cakes,true
 * Product 2,Description,per tray,15.00,Brownies,false
 * 
 * To enhance with full Excel support, install: npm install xlsx
 * Then import XLSX from 'xlsx' and use XLSX.read() to parse Excel files
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const companyId = formData.get("companyId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    // Read file content
    const text = await file.text();
    
    // Parse CSV (simple implementation)
    const lines = text.split("\n").map(line => line.trim()).filter(line => line);
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "File must contain a header row and at least one data row" },
        { status: 400 }
      );
    }

    // Parse header
    const header = lines[0].split(",").map(h => h.trim().toLowerCase());
    
    // Validate required columns
    const requiredColumns = ["name", "price"];
    const missingColumns = requiredColumns.filter(col => !header.includes(col));
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(", ")}` },
        { status: 400 }
      );
    }

    // Parse data rows
    const products = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map(v => v.trim());
        const row: any = {};
        
        header.forEach((col, index) => {
          row[col] = values[index] || "";
        });

        // Validate and parse product
        if (!row.name) {
          errors.push({ row: i + 1, error: "Missing product name" });
          continue;
        }

        const price = parseFloat(row.price);
        if (isNaN(price) || price <= 0) {
          errors.push({ row: i + 1, error: "Invalid price" });
          continue;
        }

        products.push({
          name: row.name,
          description: row.description || null,
          unit: row.unit || null,
          price,
          currency: row.currency || "GBP",
          category: row.category || null,
          isActive: row.isactive === "true" || row.isactive === "1",
          notes: row.notes || null,
          imageUrl: row.imageurl || null,
        });
      } catch (error) {
        errors.push({ row: i + 1, error: "Failed to parse row" });
      }
    }

    // Import products to database
    const imported = [];
    const importErrors = [];

    for (const productData of products) {
      try {
        const product = await prisma.wholesaleProduct.create({
          data: {
            ...productData,
            companyId: parseInt(companyId),
            sortOrder: 0,
          },
        });

        imported.push({
          id: product.id,
          name: product.name,
        });
      } catch (error) {
        importErrors.push({
          product: productData.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      imported: imported.length,
      errors: errors.length + importErrors.length,
      details: {
        imported,
        parseErrors: errors,
        importErrors,
      },
    });

  } catch (error) {
    console.error("Upload products error:", error);
    return NextResponse.json(
      { error: "Failed to upload products" },
      { status: 500 }
    );
  }
}

