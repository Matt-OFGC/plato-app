import { NextResponse } from 'next/server';
import { getCurrentUserAndCompany } from '@/lib/current';

export async function GET() {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    return NextResponse.json({ 
      success: true, 
      companyId,
      message: 'Authentication working' 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Authentication failed' 
    }, { status: 500 });
  }
}

