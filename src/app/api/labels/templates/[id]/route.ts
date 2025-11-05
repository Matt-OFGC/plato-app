import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// GET /api/labels/templates/[id] - Get a specific template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.labelTemplate.findUnique({
      where: { id: parseInt(params.id) }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PUT /api/labels/templates/[id] - Update a template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const template = await prisma.labelTemplate.update({
      where: { id: parseInt(params.id) },
      data: {
        templateName: body.templateName,
        backgroundColor: body.backgroundColor,
        textColor: body.textColor,
        accentColor: body.accentColor,
        productFont: body.productFont,
        productFontWeight: body.productFontWeight,
        productFontSize: body.productFontSize,
        subtitleFont: body.subtitleFont,
        subtitleFontWeight: body.subtitleFontWeight,
        subtitleFontSize: body.subtitleFontSize,
        bodyFont: body.bodyFont,
        bodyFontWeight: body.bodyFontWeight,
        bodyFontSize: body.bodyFontSize,
        alignment: body.alignment,
        textTransform: body.textTransform,
        spacingStyle: body.spacingStyle,
        marginMm: body.marginMm,
        widthMm: body.widthMm,
        heightMm: body.heightMm,
        showPrice: body.showPrice,
        showAllergens: body.showAllergens,
        showDietaryTags: body.showDietaryTags,
        showDate: body.showDate,
        showWeight: body.showWeight,
        showCompanyName: body.showCompanyName,
        showStorageInfo: body.showStorageInfo,
        showBarcode: body.showBarcode,
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/labels/templates/[id] - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.labelTemplate.delete({
      where: { id: parseInt(params.id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
