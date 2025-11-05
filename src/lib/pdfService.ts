import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface SalesLabelTemplate {
  id: number;
  templateName: string;
  width: number;
  height: number;
  backgroundColor: string;
  textColor: string;
  accentColor?: string;
  borderStyle: string;
  borderColor: string;
  borderWidth: number;
  cornerRadius: number;
  headerFont: string;
  headerFontSize: number;
  headerFontWeight: string;
  bodyFont: string;
  bodyFontSize: number;
  bodyFontWeight: string;
  showProductName: boolean;
  showIngredients: boolean;
  showAllergens: boolean;
  showNutritionalInfo: boolean;
  showPrice: boolean;
  showBestBefore: boolean;
  showStorageInstructions: boolean;
  showBarcode: boolean;
  logoPosition?: string;
}

interface AllergenSheetTemplate {
  id: number;
  templateName: string;
  layoutType: string;
  backgroundColor: string;
  textColor: string;
  accentColor?: string;
  headerFont: string;
  headerFontSize: number;
  headerFontWeight: string;
  bodyFont: string;
  bodyFontSize: number;
  bodyFontWeight: string;
  showIcons: boolean;
  showAllergenCodes: boolean;
  showDietaryInfo: boolean;
  showWarnings: boolean;
  showCompanyInfo: boolean;
  gridColumns: number;
}

interface Recipe {
  id: number;
  name: string;
  allergens?: string[];
  dietary_tags?: string[];
  category?: string;
  ingredients?: string;
  price?: number;
}

// A4 dimensions in mm
const A4_WIDTH = 210;
const A4_HEIGHT = 297;

// Sales Label Grid: 3 columns × 7 rows = 21 labels per page
const LABEL_COLS = 3;
const LABEL_ROWS = 7;
const LABELS_PER_PAGE = LABEL_COLS * LABEL_ROWS;

// Common allergens list
const COMMON_ALLERGENS = [
  'Gluten', 'Dairy', 'Eggs', 'Nuts', 'Peanuts', 'Soy',
  'Fish', 'Shellfish', 'Sesame', 'Mustard', 'Celery',
  'Lupin', 'Sulphites', 'Molluscs'
];

/**
 * Calculate best before date (7 days from today by default)
 */
function calculateBestBefore(daysToAdd: number = 7): string {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toLocaleDateString('en-GB');
}

/**
 * Get dietary label badge text
 */
function getDietaryLabel(tag: string): string {
  const labels: Record<string, string> = {
    'vegan': '🌱 Vegan',
    'vegetarian': '🥬 Vegetarian',
    'gluten-free': '🌾 Gluten Free',
    'dairy-free': '🥛 Dairy Free',
    'organic': '🌿 Organic',
    'halal': '☪️ Halal',
    'kosher': '✡️ Kosher'
  };
  return labels[tag.toLowerCase()] || tag;
}

/**
 * Transform text to uppercase/lowercase/capitalize
 */
function transformText(text: string, transform: string = 'none'): string {
  switch (transform) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    default:
      return text;
  }
}

/**
 * Hex color to RGB array
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [255, 255, 255];
}

/**
 * Draw a single sales label on the PDF
 */
function drawLabel(
  doc: jsPDF,
  recipe: Recipe,
  template: SalesLabelTemplate,
  x: number,
  y: number
): void {
  const width = template.width;
  const height = template.height;

  // Background
  const bgRgb = hexToRgb(template.backgroundColor);
  doc.setFillColor(bgRgb[0], bgRgb[1], bgRgb[2]);

  if (template.cornerRadius > 0) {
    doc.roundedRect(x, y, width, height, template.cornerRadius, template.cornerRadius, 'F');
  } else {
    doc.rect(x, y, width, height, 'F');
  }

  // Border
  if (template.borderStyle !== 'none') {
    const borderRgb = hexToRgb(template.borderColor);
    doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
    doc.setLineWidth(template.borderWidth);

    if (template.borderStyle === 'dashed') {
      doc.setLineDash([2, 2]);
    }

    if (template.cornerRadius > 0) {
      doc.roundedRect(x, y, width, height, template.cornerRadius, template.cornerRadius, 'S');
    } else {
      doc.rect(x, y, width, height, 'S');
    }

    doc.setLineDash([]);
  }

  // Text color
  const textRgb = hexToRgb(template.textColor);
  doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);

  // Padding
  const padding = 3;
  let currentY = y + padding + 2;

  // Product Name (Header)
  if (template.showProductName) {
    doc.setFont(template.headerFont || 'helvetica', template.headerFontWeight === '700' ? 'bold' : 'normal');
    doc.setFontSize(template.headerFontSize);

    const productName = transformText(recipe.name, 'uppercase');
    const nameLines = doc.splitTextToSize(productName, width - (padding * 2));
    doc.text(nameLines, x + padding, currentY);
    currentY += nameLines.length * (template.headerFontSize * 0.35) + 2;
  }

  // Switch to body font
  doc.setFont(template.bodyFont || 'helvetica', template.bodyFontWeight === '700' ? 'bold' : 'normal');
  doc.setFontSize(template.bodyFontSize);

  // Ingredients
  if (template.showIngredients && recipe.ingredients) {
    doc.setFontSize(template.bodyFontSize - 1);
    doc.text('Ingredients:', x + padding, currentY);
    currentY += 3;

    const ingredientLines = doc.splitTextToSize(recipe.ingredients, width - (padding * 2));
    doc.text(ingredientLines, x + padding, currentY);
    currentY += ingredientLines.length * 2.5 + 2;
  }

  // Allergens
  if (template.showAllergens && recipe.allergens && recipe.allergens.length > 0) {
    doc.setFontSize(template.bodyFontSize - 1);
    doc.setFont(template.bodyFont || 'helvetica', 'bold');
    doc.text('Allergens:', x + padding, currentY);
    currentY += 3;

    doc.setFont(template.bodyFont || 'helvetica', 'normal');
    const allergenText = recipe.allergens.join(', ');
    const allergenLines = doc.splitTextToSize(allergenText, width - (padding * 2));

    // Highlight allergens in red
    const accentRgb = template.accentColor ? hexToRgb(template.accentColor) : [220, 38, 38];
    doc.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
    doc.text(allergenLines, x + padding, currentY);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    currentY += allergenLines.length * 2.5 + 2;
  }

  // Dietary Tags
  if (recipe.dietary_tags && recipe.dietary_tags.length > 0) {
    doc.setFontSize(template.bodyFontSize - 2);
    const tags = recipe.dietary_tags.map(tag => getDietaryLabel(tag)).join(' • ');
    doc.text(tags, x + padding, currentY);
    currentY += 3;
  }

  // Best Before Date
  if (template.showBestBefore) {
    doc.setFontSize(template.bodyFontSize - 1);
    doc.setFont(template.bodyFont || 'helvetica', 'bold');
    doc.text(`Best Before: ${calculateBestBefore()}`, x + padding, currentY);
    currentY += 3;
  }

  // Storage Instructions
  if (template.showStorageInstructions) {
    doc.setFontSize(template.bodyFontSize - 2);
    doc.setFont(template.bodyFont || 'helvetica', 'normal');
    doc.text('Store in a cool, dry place', x + padding, currentY);
    currentY += 3;
  }

  // Price (bottom right)
  if (template.showPrice && recipe.price) {
    doc.setFontSize(template.headerFontSize - 2);
    doc.setFont(template.headerFont || 'helvetica', 'bold');
    doc.text(`£${recipe.price.toFixed(2)}`, x + width - padding - 10, y + height - padding);
  }
}

/**
 * Generate Sales Labels PDF
 */
export async function generateLabelsPDF(
  template: SalesLabelTemplate,
  recipes: Recipe[]
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const labelWidth = template.width;
  const labelHeight = template.height;

  // Calculate spacing to distribute labels evenly across A4 page
  const horizontalSpacing = (A4_WIDTH - (LABEL_COLS * labelWidth)) / (LABEL_COLS + 1);
  const verticalSpacing = (A4_HEIGHT - (LABEL_ROWS * labelHeight)) / (LABEL_ROWS + 1);

  let labelIndex = 0;

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];

    // Calculate position in grid
    const row = labelIndex % LABEL_ROWS;
    const col = Math.floor(labelIndex / LABEL_ROWS) % LABEL_COLS;

    // Calculate x, y coordinates
    const x = horizontalSpacing + (col * (labelWidth + horizontalSpacing));
    const y = verticalSpacing + (row * (labelHeight + verticalSpacing));

    // Draw label
    drawLabel(doc, recipe, template, x, y);

    labelIndex++;

    // Add new page if we've filled the current page and have more labels
    if (labelIndex >= LABELS_PER_PAGE && i < recipes.length - 1) {
      doc.addPage();
      labelIndex = 0;
    }
  }

  // Generate blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

/**
 * Draw allergen sheet for a single recipe (one per A4 page)
 */
function drawAllergenSheet(
  doc: jsPDF,
  recipe: Recipe,
  template: AllergenSheetTemplate,
  isFirstPage: boolean
): void {
  const bgRgb = hexToRgb(template.backgroundColor);
  doc.setFillColor(bgRgb[0], bgRgb[1], bgRgb[2]);
  doc.rect(0, 0, A4_WIDTH, A4_HEIGHT, 'F');

  const textRgb = hexToRgb(template.textColor);
  doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);

  const padding = 15;
  let currentY = padding;

  // Header
  doc.setFont(template.headerFont || 'helvetica', template.headerFontWeight === '700' ? 'bold' : 'normal');
  doc.setFontSize(template.headerFontSize);

  if (template.layoutType === 'detailed') {
    doc.text('Allergen Information', A4_WIDTH / 2, currentY, { align: 'center' });
  } else if (template.layoutType === 'simple') {
    doc.text('Allergen Reference', A4_WIDTH / 2, currentY, { align: 'center' });
  } else {
    doc.text('Allergen Matrix', A4_WIDTH / 2, currentY, { align: 'center' });
  }
  currentY += 8;

  // Company info
  if (template.showCompanyInfo) {
    doc.setFontSize(template.bodyFontSize - 1);
    doc.setFont(template.bodyFont || 'helvetica', 'normal');
    doc.text(`Plato Bakery • Updated ${new Date().toLocaleDateString()}`, A4_WIDTH / 2, currentY, { align: 'center' });
    currentY += 10;
  } else {
    currentY += 5;
  }

  // Recipe Name
  doc.setFont(template.headerFont || 'helvetica', 'bold');
  doc.setFontSize(template.headerFontSize - 4);
  doc.text(recipe.name, padding, currentY);
  currentY += 8;

  // Switch to body font
  doc.setFont(template.bodyFont || 'helvetica', 'normal');
  doc.setFontSize(template.bodyFontSize);

  const recipeAllergens = recipe.allergens || [];

  if (template.layoutType === 'detailed') {
    // Detailed layout - list each allergen
    const allergenBoxWidth = (A4_WIDTH - (padding * 2) - 5) / 2;
    const allergenBoxHeight = 8;
    let allergenX = padding;
    let allergenY = currentY;
    let column = 0;

    COMMON_ALLERGENS.forEach((allergen, index) => {
      const hasAllergen = recipeAllergens.some(a =>
        a.toLowerCase().includes(allergen.toLowerCase())
      );

      // Background box
      if (hasAllergen) {
        doc.setFillColor(254, 226, 226); // red-50
      } else {
        doc.setFillColor(249, 250, 251); // gray-50
      }
      doc.roundedRect(allergenX, allergenY, allergenBoxWidth, allergenBoxHeight, 2, 2, 'F');

      // Icon and text
      if (hasAllergen) {
        doc.setTextColor(220, 38, 38); // red-600
        doc.text('⚠ ' + allergen, allergenX + 3, allergenY + 5.5);

        if (template.showAllergenCodes) {
          doc.setFont(template.bodyFont || 'helvetica', 'bold');
          doc.text('YES', allergenX + allergenBoxWidth - 10, allergenY + 5.5);
          doc.setFont(template.bodyFont || 'helvetica', 'normal');
        }
      } else {
        doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
        doc.text(template.showIcons ? '✓ ' + allergen : allergen, allergenX + 3, allergenY + 5.5);
      }

      // Move to next position
      column++;
      if (column >= 2) {
        column = 0;
        allergenX = padding;
        allergenY += allergenBoxHeight + 2;
      } else {
        allergenX += allergenBoxWidth + 5;
      }
    });

    currentY = allergenY + 5;

    // Dietary tags
    if (template.showDietaryInfo && recipe.dietary_tags && recipe.dietary_tags.length > 0) {
      doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
      doc.setFontSize(template.bodyFontSize - 1);

      recipe.dietary_tags.forEach((tag, index) => {
        const accentRgb = template.accentColor ? hexToRgb(template.accentColor) : [229, 231, 235];
        doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
        const tagWidth = doc.getTextWidth(getDietaryLabel(tag)) + 6;
        doc.roundedRect(padding + (index * (tagWidth + 3)), currentY, tagWidth, 6, 3, 3, 'F');
        doc.text(getDietaryLabel(tag), padding + 3 + (index * (tagWidth + 3)), currentY + 4);
      });

      currentY += 10;
    }

  } else if (template.layoutType === 'simple') {
    // Simple table layout
    const tableData = COMMON_ALLERGENS.slice(0, 8).map(allergen => {
      const hasAllergen = recipeAllergens.some(a =>
        a.toLowerCase().includes(allergen.toLowerCase())
      );
      return [allergen, hasAllergen ? '✓' : '✗'];
    });

    (doc as any).autoTable({
      startY: currentY,
      head: [['Allergen', 'Present']],
      body: tableData,
      margin: { left: padding, right: padding },
      styles: {
        fontSize: template.bodyFontSize,
        cellPadding: 3
      },
      headStyles: {
        fillColor: template.accentColor ? hexToRgb(template.accentColor) : [243, 244, 246],
        textColor: hexToRgb(template.textColor)
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

  } else {
    // Matrix layout - compact grid
    const gridCols = 3;
    const boxSize = 25;
    const boxSpacing = 5;
    let gridX = padding;
    let gridY = currentY;

    COMMON_ALLERGENS.slice(0, 9).forEach((allergen, index) => {
      const hasAllergen = recipeAllergens.some(a =>
        a.toLowerCase().includes(allergen.toLowerCase())
      );

      // Box background
      if (hasAllergen) {
        doc.setFillColor(254, 226, 226); // red-100
        doc.setTextColor(153, 27, 27); // red-800
      } else {
        doc.setFillColor(243, 244, 246); // gray-100
        doc.setTextColor(107, 114, 128); // gray-500
      }

      doc.roundedRect(gridX, gridY, boxSize, boxSize, 2, 2, 'F');

      // Allergen code (first 3 letters)
      doc.setFontSize(template.bodyFontSize - 1);
      doc.setFont(template.bodyFont || 'helvetica', hasAllergen ? 'bold' : 'normal');
      const code = allergen.substring(0, 3).toUpperCase();
      doc.text(code, gridX + boxSize / 2, gridY + boxSize / 2 + 1, { align: 'center' });

      // Move to next position
      if ((index + 1) % gridCols === 0) {
        gridX = padding;
        gridY += boxSize + boxSpacing;
      } else {
        gridX += boxSize + boxSpacing;
      }
    });

    currentY = gridY + 5;
  }

  // Warning footer
  if (template.showWarnings) {
    doc.setFillColor(254, 252, 232); // yellow-50
    doc.roundedRect(padding, A4_HEIGHT - 25, A4_WIDTH - (padding * 2), 18, 3, 3, 'F');

    doc.setDrawColor(254, 240, 138); // yellow-200
    doc.setLineWidth(0.5);
    doc.roundedRect(padding, A4_HEIGHT - 25, A4_WIDTH - (padding * 2), 18, 3, 3, 'S');

    doc.setTextColor(161, 98, 7); // yellow-800
    doc.setFontSize(template.bodyFontSize - 2);
    doc.setFont(template.bodyFont || 'helvetica', 'bold');
    doc.text('⚠ Cross-Contamination Warning', padding + 3, A4_HEIGHT - 20);

    doc.setFont(template.bodyFont || 'helvetica', 'normal');
    doc.setFontSize(template.bodyFontSize - 3);
    const warningText = 'All products are prepared in a facility that handles nuts, dairy, gluten, and other allergens. Please inform staff of any allergies before ordering.';
    const warningLines = doc.splitTextToSize(warningText, A4_WIDTH - (padding * 2) - 6);
    doc.text(warningLines, padding + 3, A4_HEIGHT - 16);
  }
}

/**
 * Generate Allergen Sheets PDF
 */
export async function generateAllergenSheetsPDF(
  template: AllergenSheetTemplate,
  recipes: Recipe[]
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  recipes.forEach((recipe, index) => {
    if (index > 0) {
      doc.addPage();
    }
    drawAllergenSheet(doc, recipe, template, index === 0);
  });

  // Generate blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

/**
 * Download PDF blob as file
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
