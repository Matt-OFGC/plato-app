import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // Security: Check for secret or allow in development
    const authHeader = request.headers.get('authorization');
    const secret = process.env.MIGRATION_SECRET;
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development';
    
    // In production, require secret. In development, allow without secret for easier testing
    if (!isDevelopment && !secret) {
      return NextResponse.json({ error: 'Migration not configured - MIGRATION_SECRET required in production' }, { status: 500 });
    }
    
    if (!isDevelopment && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Running customerType migration...', {}, 'Migration');

    // Check if column already exists
    const columnCheck = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'WholesaleCustomer' 
      AND column_name = 'customerType'
    `;
    
    if (columnCheck.length > 0) {
      logger.info('Column customerType already exists', {}, 'Migration');
      return NextResponse.json({ 
        success: true, 
        message: 'Column already exists',
        alreadyApplied: true
      });
    }

    // Add the column
    await prisma.$executeRaw`
      ALTER TABLE "WholesaleCustomer" ADD COLUMN IF NOT EXISTS "customerType" TEXT DEFAULT 'wholesale'
    `;
    logger.info('Added customerType column', {}, 'Migration');

    // Update existing records
    const updateResult = await prisma.$executeRaw`
      UPDATE "WholesaleCustomer" SET "customerType" = 'wholesale' WHERE "customerType" IS NULL
    `;
    logger.info('Updated existing customers', { count: updateResult }, 'Migration');

    // Verify the migration
    const verifyResult = await prisma.$queryRaw<Array<{ customerType: string | null; count: bigint }>>`
      SELECT "customerType", COUNT(*) as count
      FROM "WholesaleCustomer"
      GROUP BY "customerType"
    `;
    
    const summary = verifyResult.map(row => ({
      customerType: row.customerType || 'NULL',
      count: Number(row.count)
    }));

    logger.info('Migration completed successfully', { summary }, 'Migration');

    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully',
      summary
    });
  } catch (error: any) {
    logger.error('Migration failed', error, 'Migration');
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Customer Type Migration Endpoint',
    usage: 'POST with Authorization: Bearer <MIGRATION_SECRET>'
  });
}
