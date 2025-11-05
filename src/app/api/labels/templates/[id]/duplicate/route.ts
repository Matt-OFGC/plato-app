import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// POST /api/labels/templates/[id]/duplicate - Duplicate a template
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the original template
    const original = await prisma.labelTemplate.findUnique({
      where: { id: parseInt(params.id) }
    });

    if (!original) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Create a copy
    const duplicate = await prisma.labelTemplate.create({
      data: {
        companyId: original.companyId,
        templateName: `${original.templateName} (Copy)`,
        templateType: 'custom',
        backgroundColor: original.backgroundColor,
        textColor: original.textColor,
        accentColor: original.accentColor,
        productFont: original.productFont,
        productFontWeight: original.productFontWeight,
        productFontSize: original.productFontSize,
        subtitleFont: original.subtitleFont,
        subtitleFontWeight: original.subtitleFontWeight,
        subtitleFontSize: original.subtitleFontSize,
        bodyFont: original.bodyFont,
        bodyFontWeight: original.bodyFontWeight,
        bodyFontSize: original.bodyFontSize,
        alignment: original.alignment,
        textTransform: original.textTransform,
        spacingStyle: original.spacingStyle,
        marginMm: original.marginMm,
        widthMm: original.widthMm,
        heightMm: original.heightMm,
        showPrice: original.showPrice,
        showAllergens: original.showAllergens,
        showDietaryTags: original.showDietaryTags,
        showDate: original.showDate,
        showWeight: original.showWeight,
        showCompanyName: original.showCompanyName,
        showStorageInfo: original.showStorageInfo,
        showBarcode: original.showBarcode,
        isDefault: false,
        isSystemTemplate: false,
      }
    });

    return NextResponse.json(duplicate, { status: 201 });
  } catch (error) {
    console.error('Error duplicating template:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate template' },
      { status: 500 }
    );
  }
}
