import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserAndCompany } from '@/lib/current';
import { logger } from '@/lib/logger';

// GET /api/allergen-sheets/templates - Get all allergen sheet templates
export async function GET(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();

    const templates = await prisma.allergenSheetTemplate.findMany({
      where: {
        OR: [
          { isSystemTemplate: true },
          ...(companyId ? [{ companyId }] : [])
        ]
      },
      orderBy: [
        { isSystemTemplate: 'desc' },
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Format the response (convert snake_case to camelCase for frontend)
    const formattedTemplates = templates.map(t => ({
      id: t.id,
      templateName: t.templateName,
      layoutType: t.layoutType,
      backgroundColor: t.backgroundColor,
      textColor: t.textColor,
      accentColor: t.accentColor,
      headerFont: t.headerFont,
      headerFontSize: t.headerFontSize,
      headerFontWeight: t.headerFontWeight,
      bodyFont: t.bodyFont,
      bodyFontSize: t.bodyFontSize,
      bodyFontWeight: t.bodyFontWeight,
      showIcons: t.showIcons,
      showAllergenCodes: t.showAllergenCodes,
      showDietaryInfo: t.showDietaryInfo,
      showWarnings: t.showWarnings,
      showCompanyInfo: t.showCompanyInfo,
      gridColumns: t.gridColumns,
      isDefault: t.isDefault,
      isSystemTemplate: t.isSystemTemplate,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }));

    return NextResponse.json(formattedTemplates);
  } catch (error) {
    logger.error('Error fetching allergen sheet templates', error, 'AllergenSheets/Templates');
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/allergen-sheets/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: 'No company found' }, { status: 404 });
    }

    const body = await request.json();

    const template = await prisma.allergenSheetTemplate.create({
      data: {
        companyId,
        templateName: body.templateName,
        layoutType: body.layoutType || 'detailed',
        backgroundColor: body.backgroundColor || '#FFFFFF',
        textColor: body.textColor || '#1F2937',
        accentColor: body.accentColor,
        headerFont: body.headerFont || 'Inter',
        headerFontSize: body.headerFontSize || 24,
        headerFontWeight: body.headerFontWeight || '700',
        bodyFont: body.bodyFont || 'Inter',
        bodyFontSize: body.bodyFontSize || 11,
        bodyFontWeight: body.bodyFontWeight || '400',
        showIcons: body.showIcons ?? true,
        showAllergenCodes: body.showAllergenCodes ?? true,
        showDietaryInfo: body.showDietaryInfo ?? true,
        showWarnings: body.showWarnings ?? true,
        showCompanyInfo: body.showCompanyInfo ?? true,
        gridColumns: body.gridColumns || 2,
        isDefault: false,
        isSystemTemplate: false
      }
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    logger.error('Error creating template', error, 'AllergenSheets/Templates');
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
