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
      // Use node to run the Prisma CLI
      // This works in serverless environments like Vercel
      const output = execSync('node node_modules/prisma/build/index.js migrate deploy', { 
        encoding: 'utf8',
        env: { ...process.env },
        cwd: process.cwd()
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Database migrations completed successfully',
        output: output
      });
    } catch (error: any) {
      console.error('Migration error:', error);
      const errorDetails = {
        message: error.message || 'Unknown error',
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || '',
        status: error.status
      };
      return NextResponse.json({ 
        error: 'Migration failed', 
        details: errorDetails
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
