import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Only allow this in development or with a secret key
    const authHeader = request.headers.get('authorization');
    const secret = process.env.MIGRATION_SECRET;
    
    // In production, MIGRATION_SECRET must be set
    if (!secret) {
      return NextResponse.json({ error: 'Migration not configured' }, { status: 500 });
    }
    
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run the migration SQL directly
    try {
      // Check if the column already exists
      const result = await prisma.$queryRaw<any[]>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Ingredient' 
        AND column_name = 'customConversions'
      `;
      
      if (result.length > 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'Migration already applied - customConversions column exists',
          alreadyApplied: true
        });
      }
      
      // Add the column
      await prisma.$executeRaw`
        ALTER TABLE "Ingredient" ADD COLUMN "customConversions" TEXT
      `;
      
      return NextResponse.json({ 
        success: true, 
        message: 'Database migration completed successfully - added customConversions column'
      });
    } catch (error: any) {
      console.error('Migration error:', error);
      return NextResponse.json({ 
        error: 'Migration failed', 
        details: error.message || 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Migration endpoint. Use POST with authorization header.' 
  });
}
