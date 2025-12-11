import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

// GET /api/generated-documents - Get document history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'label' or 'allergen_sheet'
    const days = parseInt(searchParams.get('days') || '7');

    // Calculate date filter
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - days);

    // TODO: Get company_id from session
    // const companyId = await getCompanyIdFromSession(request);

    const documents = await prisma.generatedDocument.findMany({
      where: {
        // companyId, // Add when auth is ready
        documentType: type || undefined,
        generatedAt: {
          gte: dateFilter
        }
      },
      orderBy: {
        generatedAt: 'desc'
      },
      take: 100 // Limit to 100 most recent
    });

    // Format the response
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      documentType: doc.documentType,
      templateId: doc.templateId,
      products: doc.products,
      totalItems: doc.totalItems,
      sheetsPrinted: doc.sheetsPrinted,
      pdfFilePath: doc.pdfFilePath,
      generatedBy: doc.generatedBy,
      generatedAt: doc.generatedAt,
      notes: doc.notes,
      // TODO: Add generated_by_name from user relation when auth is ready
      generated_by_name: 'User'
    }));

    return NextResponse.json(formattedDocuments);
  } catch (error) {
    logger.error('Error fetching documents', error, 'GeneratedDocuments');
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/generated-documents - Create a new document record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Get company_id and user_id from session
    const companyId = 1; // Replace with actual company ID
    const userId = 1; // Replace with actual user ID

    const document = await prisma.generatedDocument.create({
      data: {
        companyId,
        documentType: body.documentType,
        templateId: body.templateId,
        products: body.products,
        totalItems: body.totalItems,
        sheetsPrinted: body.sheetsPrinted,
        pdfFilePath: body.pdfFilePath,
        fileSizeBytes: body.fileSizeBytes,
        generatedBy: userId,
        notes: body.notes
      }
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    logger.error('Error creating document', error, 'GeneratedDocuments');
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}
