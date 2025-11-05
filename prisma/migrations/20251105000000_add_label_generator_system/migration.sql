-- CreateTable
CREATE TABLE "LabelTemplate" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER,
    "templateName" TEXT NOT NULL,
    "templateType" TEXT NOT NULL DEFAULT 'custom',
    "backgroundColor" TEXT NOT NULL DEFAULT '#E8E4DC',
    "textColor" TEXT NOT NULL DEFAULT '#6D7C6F',
    "accentColor" TEXT,
    "productFont" TEXT NOT NULL DEFAULT 'Poppins',
    "productFontWeight" TEXT NOT NULL DEFAULT 'Bold',
    "productFontSize" INTEGER NOT NULL DEFAULT 48,
    "subtitleFont" TEXT NOT NULL DEFAULT 'Poppins',
    "subtitleFontWeight" TEXT NOT NULL DEFAULT 'SemiBold',
    "subtitleFontSize" INTEGER NOT NULL DEFAULT 18,
    "bodyFont" TEXT NOT NULL DEFAULT 'Poppins',
    "bodyFontWeight" TEXT NOT NULL DEFAULT 'Regular',
    "bodyFontSize" INTEGER NOT NULL DEFAULT 10,
    "alignment" TEXT NOT NULL DEFAULT 'center',
    "textTransform" TEXT NOT NULL DEFAULT 'uppercase',
    "spacingStyle" TEXT NOT NULL DEFAULT 'normal',
    "marginMm" DECIMAL(65,30) NOT NULL DEFAULT 2.0,
    "widthMm" DECIMAL(65,30) NOT NULL DEFAULT 65.0,
    "heightMm" DECIMAL(65,30) NOT NULL DEFAULT 38.0,
    "showPrice" BOOLEAN NOT NULL DEFAULT true,
    "showAllergens" BOOLEAN NOT NULL DEFAULT true,
    "showDietaryTags" BOOLEAN NOT NULL DEFAULT true,
    "showDate" BOOLEAN NOT NULL DEFAULT true,
    "showWeight" BOOLEAN NOT NULL DEFAULT false,
    "showCompanyName" BOOLEAN NOT NULL DEFAULT false,
    "showStorageInfo" BOOLEAN NOT NULL DEFAULT false,
    "showBarcode" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSystemTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER,

    CONSTRAINT "LabelTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllergenSheetTemplate" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" INTEGER,
    "templateName" TEXT NOT NULL,
    "templateType" TEXT NOT NULL DEFAULT 'custom',
    "sheetStyle" TEXT NOT NULL DEFAULT 'full_detail',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "textColor" TEXT NOT NULL DEFAULT '#000000',
    "headingColor" TEXT NOT NULL DEFAULT '#2D3142',
    "warningColor" TEXT NOT NULL DEFAULT '#FF6B6B',
    "headingFont" TEXT NOT NULL DEFAULT 'Poppins',
    "headingSize" INTEGER NOT NULL DEFAULT 24,
    "bodyFont" TEXT NOT NULL DEFAULT 'Poppins',
    "bodySize" INTEGER NOT NULL DEFAULT 11,
    "pageMarginsMm" DECIMAL(65,30) NOT NULL DEFAULT 15.0,
    "showFullIngredients" BOOLEAN NOT NULL DEFAULT true,
    "showAllergenList" BOOLEAN NOT NULL DEFAULT true,
    "showDietarySuitability" BOOLEAN NOT NULL DEFAULT true,
    "showStorageInfo" BOOLEAN NOT NULL DEFAULT true,
    "showWeight" BOOLEAN NOT NULL DEFAULT true,
    "showBestBefore" BOOLEAN NOT NULL DEFAULT true,
    "showCompanyDetails" BOOLEAN NOT NULL DEFAULT true,
    "showContactInfo" BOOLEAN NOT NULL DEFAULT true,
    "showLastUpdated" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSystemTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER,

    CONSTRAINT "AllergenSheetTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" INTEGER NOT NULL,
    "documentType" TEXT NOT NULL,
    "templateId" INTEGER,
    "products" JSONB NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "sheetsPrinted" INTEGER,
    "pdfFilePath" TEXT,
    "fileSizeBytes" INTEGER,
    "generatedBy" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeUpdateLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipeId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "updateType" TEXT NOT NULL,
    "changedField" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "allergenImpact" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeUpdateLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabelTemplate_companyId_idx" ON "LabelTemplate"("companyId");

-- CreateIndex
CREATE INDEX "LabelTemplate_companyId_isSystemTemplate_idx" ON "LabelTemplate"("companyId", "isSystemTemplate");

-- CreateIndex
CREATE INDEX "AllergenSheetTemplate_companyId_idx" ON "AllergenSheetTemplate"("companyId");

-- CreateIndex
CREATE INDEX "AllergenSheetTemplate_companyId_isSystemTemplate_idx" ON "AllergenSheetTemplate"("companyId", "isSystemTemplate");

-- CreateIndex
CREATE INDEX "GeneratedDocument_companyId_idx" ON "GeneratedDocument"("companyId");

-- CreateIndex
CREATE INDEX "GeneratedDocument_companyId_documentType_generatedAt_idx" ON "GeneratedDocument"("companyId", "documentType", "generatedAt");

-- CreateIndex
CREATE INDEX "RecipeUpdateLog_companyId_idx" ON "RecipeUpdateLog"("companyId");

-- CreateIndex
CREATE INDEX "RecipeUpdateLog_recipeId_idx" ON "RecipeUpdateLog"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeUpdateLog_companyId_allergenImpact_updatedAt_idx" ON "RecipeUpdateLog"("companyId", "allergenImpact", "updatedAt");

-- AddForeignKey
ALTER TABLE "LabelTemplate" ADD CONSTRAINT "LabelTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllergenSheetTemplate" ADD CONSTRAINT "AllergenSheetTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeUpdateLog" ADD CONSTRAINT "RecipeUpdateLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeUpdateLog" ADD CONSTRAINT "RecipeUpdateLog_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed 5 System Label Templates
INSERT INTO "LabelTemplate" (
  "companyId", "templateName", "templateType", "isSystemTemplate",
  "backgroundColor", "textColor",
  "productFont", "productFontWeight", "productFontSize",
  "subtitleFont", "subtitleFontWeight", "subtitleFontSize",
  "bodyFont", "bodyFontWeight", "bodyFontSize",
  "alignment", "textTransform", "spacingStyle", "marginMm",
  "widthMm", "heightMm",
  "showPrice", "showAllergens", "showDietaryTags", "showDate",
  "createdAt", "updatedAt"
) VALUES
-- Template 1: Butler's Classic
(
  NULL, 'Butler''s Classic', 'preset', true,
  '#E8E4DC', '#6D7C6F',
  'Poppins', 'Bold', 48,
  'Poppins', 'SemiBold', 18,
  'Poppins', 'Regular', 10,
  'center', 'uppercase', 'normal', 2.0,
  65.0, 38.0,
  true, true, true, true,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
-- Template 2: Modern Minimal
(
  NULL, 'Modern Minimal', 'preset', true,
  '#FFFFFF', '#000000',
  'Inter', 'Black', 36,
  'Inter', 'Regular', 14,
  'Inter', 'Regular', 11,
  'left', 'uppercase', 'normal', 3.0,
  65.0, 38.0,
  true, true, true, false,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
-- Template 3: Traditional Bakery
(
  NULL, 'Traditional Bakery', 'preset', true,
  '#FFF8F0', '#4A3B2A',
  'Playfair Display', 'Bold', 32,
  'Playfair Display', 'SemiBold', 16,
  'Lora', 'Regular', 10,
  'center', 'titlecase', 'generous', 3.0,
  65.0, 38.0,
  true, true, true, false,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
-- Template 4: Bold & Bright
(
  NULL, 'Bold & Bright', 'preset', true,
  '#FFFEF7', '#2D3142',
  'Montserrat', 'ExtraBold', 42,
  'Montserrat', 'Bold', 16,
  'Montserrat', 'Medium', 11,
  'center', 'uppercase', 'compact', 2.0,
  65.0, 38.0,
  true, true, true, false,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
-- Template 5: Elegant Script
(
  NULL, 'Elegant Script', 'preset', true,
  '#F5F3F0', '#2C2416',
  'Cormorant Garamond', 'Bold', 38,
  'Crimson Text', 'SemiBold', 16,
  'Crimson Text', 'Regular', 10,
  'center', 'titlecase', 'generous', 3.0,
  65.0, 38.0,
  true, true, true, true,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- Seed 3 System Allergen Sheet Templates
INSERT INTO "AllergenSheetTemplate" (
  "companyId", "templateName", "templateType", "isSystemTemplate",
  "sheetStyle", "backgroundColor", "textColor", "headingColor", "warningColor",
  "headingFont", "headingSize", "bodyFont", "bodySize", "pageMarginsMm",
  "showFullIngredients", "showAllergenList", "showDietarySuitability",
  "showStorageInfo", "showWeight", "showBestBefore", "showCompanyDetails",
  "showContactInfo", "showLastUpdated",
  "createdAt", "updatedAt"
) VALUES
-- Template 1: Full Detail (Legal Compliance)
(
  NULL, 'Full Detail (Legal Compliance)', 'preset', true,
  'full_detail', '#FFFFFF', '#000000', '#2D3142', '#FF6B6B',
  'Poppins', 24, 'Poppins', 11, 15.0,
  true, true, true, true, true, true, true, true, true,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
-- Template 2: Simple Reference
(
  NULL, 'Simple Reference', 'preset', true,
  'simple', '#FFFFFF', '#000000', '#1A1A1A', '#DC2626',
  'Inter', 20, 'Inter', 12, 10.0,
  false, true, false, false, false, false, true, false, false,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
-- Template 3: Visual Matrix
(
  NULL, 'Visual Matrix', 'preset', true,
  'matrix', '#F9FAFB', '#111827', '#1F2937', '#EF4444',
  'Roboto', 22, 'Roboto', 11, 12.0,
  false, true, false, false, false, false, false, false, false,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
