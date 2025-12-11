import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

// GET /api/labels/templates - Get all templates for the user's company
export async function GET(request: NextRequest) {
  try {
    // TODO: Get company_id from session
    // For now, we'll get all templates

    const templates = await prisma.labelTemplate.findMany({
      where: {
        OR: [
          { isSystemTemplate: true },
          // { companyId: companyId } // Add when auth is ready
        ]
      },
      orderBy: [
        { isSystemTemplate: 'desc' },
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Convert snake_case to camelCase for frontend
    const formattedTemplates = templates.map(t => ({
      id: t.id,
      templateName: t.templateName,
      templateType: t.templateType,
      backgroundColor: t.backgroundColor,
      textColor: t.textColor,
      accentColor: t.accentColor,
      productFont: t.productFont,
      productFontWeight: t.productFontWeight,
      productFontSize: t.productFontSize,
      subtitleFont: t.subtitleFont,
      subtitleFontWeight: t.subtitleFontWeight,
      subtitleFontSize: t.subtitleFontSize,
      bodyFont: t.bodyFont,
      bodyFontWeight: t.bodyFontWeight,
      bodyFontSize: t.bodyFontSize,
      alignment: t.alignment,
      textTransform: t.textTransform,
      spacingStyle: t.spacingStyle,
      marginMm: Number(t.marginMm),
      widthMm: Number(t.widthMm),
      heightMm: Number(t.heightMm),
      showPrice: t.showPrice,
      showAllergens: t.showAllergens,
      showDietaryTags: t.showDietaryTags,
      showDate: t.showDate,
      showWeight: t.showWeight,
      showCompanyName: t.showCompanyName,
      showStorageInfo: t.showStorageInfo,
      showBarcode: t.showBarcode,
      isDefault: t.isDefault,
      isSystemTemplate: t.isSystemTemplate,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json(formattedTemplates);
  } catch (error) {
    logger.error('Error fetching templates', error, 'Labels/Templates');
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/labels/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Get company_id from session
    const companyId = null; // Replace with actual company ID from session

    const template = await prisma.labelTemplate.create({
      data: {
        companyId,
        templateName: body.templateName,
        templateType: 'custom',
        backgroundColor: body.backgroundColor || '#FFFFFF',
        textColor: body.textColor || '#000000',
        accentColor: body.accentColor,
        productFont: body.productFont || 'Poppins',
        productFontWeight: body.productFontWeight || 'Bold',
        productFontSize: body.productFontSize || 48,
        subtitleFont: body.subtitleFont || 'Poppins',
        subtitleFontWeight: body.subtitleFontWeight || 'SemiBold',
        subtitleFontSize: body.subtitleFontSize || 18,
        bodyFont: body.bodyFont || 'Poppins',
        bodyFontWeight: body.bodyFontWeight || 'Regular',
        bodyFontSize: body.bodyFontSize || 10,
        alignment: body.alignment || 'center',
        textTransform: body.textTransform || 'uppercase',
        spacingStyle: body.spacingStyle || 'normal',
        marginMm: body.marginMm || 2.0,
        widthMm: body.widthMm || 65.0,
        heightMm: body.heightMm || 38.0,
        showPrice: body.showPrice !== false,
        showAllergens: body.showAllergens !== false,
        showDietaryTags: body.showDietaryTags !== false,
        showDate: body.showDate !== false,
        showWeight: body.showWeight || false,
        showCompanyName: body.showCompanyName || false,
        showStorageInfo: body.showStorageInfo || false,
        showBarcode: body.showBarcode || false,
        isDefault: body.isDefault || false,
        isSystemTemplate: false,
      }
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    logger.error('Error creating template', error, 'Labels/Templates');
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
