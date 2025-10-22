import { NextRequest, NextResponse } from 'next/server';

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

    // Run Prisma migrations
    const { execSync } = require('child_process');
    
    try {
      // Run migrations from prisma/migrations folder
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Database migrations completed successfully' 
      });
    } catch (error) {
      console.error('Migration error:', error);
      return NextResponse.json({ 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
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
