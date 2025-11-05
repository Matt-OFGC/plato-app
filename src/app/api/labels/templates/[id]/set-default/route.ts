import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// POST /api/labels/templates/[id]/set-default - Set template as default
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = parseInt(params.id);

    // Get the template to find the company
    const template = await prisma.labelTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // First, unset all other defaults for this company
    await prisma.labelTemplate.updateMany({
      where: {
        companyId: template.companyId,
        isDefault: true
      },
      data: {
        isDefault: false
      }
    });

    // Then set this template as default
    const updatedTemplate = await prisma.labelTemplate.update({
      where: { id: templateId },
      data: {
        isDefault: true
      }
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('Error setting default template:', error);
    return NextResponse.json(
      { error: 'Failed to set default template' },
      { status: 500 }
    );
  }
}
