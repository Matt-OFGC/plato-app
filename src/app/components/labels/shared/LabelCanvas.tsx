"use client";

import React from 'react';

interface LabelTemplate {
  backgroundColor: string;
  textColor: string;
  accentColor?: string;
  productFont: string;
  productFontWeight: string;
  productFontSize: number;
  subtitleFont: string;
  subtitleFontWeight: string;
  subtitleFontSize: number;
  bodyFont: string;
  bodyFontWeight: string;
  bodyFontSize: number;
  alignment: string;
  textTransform: string;
  spacingStyle: string;
  marginMm: number;
  widthMm: number;
  heightMm: number;
  showPrice: boolean;
  showAllergens: boolean;
  showDietaryTags: boolean;
  showDate: boolean;
  showWeight?: boolean;
  showCompanyName?: boolean;
  showStorageInfo?: boolean;
  showBarcode?: boolean;
}

interface LabelData {
  productName: string;
  price?: number;
  allergens?: string[];
  dietaryTags?: string[];
  bestBefore?: string;
  weight?: string;
  companyName?: string;
  storageInfo?: string;
}

interface LabelCanvasProps {
  template: LabelTemplate;
  data: LabelData;
  scale?: number;
}

export function LabelCanvas({ template, data, scale = 1 }: LabelCanvasProps) {
  // Convert mm to pixels for display (assuming 96 DPI)
  const mmToPixels = (mm: number) => (mm * 96) / 25.4 * scale;

  const width = mmToPixels(template.widthMm);
  const height = mmToPixels(template.heightMm);
  const margin = mmToPixels(template.marginMm);

  // Spacing multipliers
  const spacingMultiplier = {
    compact: 0.5,
    normal: 1,
    generous: 1.5
  }[template.spacingStyle] || 1;

  // Transform product name based on settings
  const transformText = (text: string) => {
    switch (template.textTransform) {
      case 'uppercase':
        return text.toUpperCase();
      case 'lowercase':
        return text.toLowerCase();
      case 'titlecase':
        return text.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
      default:
        return text;
    }
  };

  // Get dietary tag display text
  const getDietaryTagText = (tag: string) => {
    const tagMap: Record<string, string> = {
      'vegan': 'VEGAN',
      'vegetarian': 'VEGETARIAN',
      'gluten_free': 'MADE WITHOUT GLUTEN',
      'dairy_free': 'DAIRY FREE',
      'nut_free': 'NUT FREE',
      'made_without_gluten': 'MADE WITHOUT GLUTEN'
    };
    return tagMap[tag] || tag.toUpperCase();
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: template.backgroundColor,
        color: template.textColor,
        padding: `${margin}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: template.alignment === 'left' ? 'flex-start' :
                    template.alignment === 'right' ? 'flex-end' : 'center',
        textAlign: template.alignment as any,
      }}
    >
      {/* Product Name */}
      <div
        style={{
          fontFamily: template.productFont,
          fontWeight: template.productFontWeight as any,
          fontSize: `${template.productFontSize * scale}px`,
          lineHeight: 1.1,
          marginBottom: `${8 * spacingMultiplier * scale}px`,
          wordWrap: 'break-word',
          maxWidth: '100%',
        }}
      >
        {transformText(data.productName)}
      </div>

      {/* Dietary Tags */}
      {template.showDietaryTags && data.dietaryTags && data.dietaryTags.length > 0 && (
        <div
          style={{
            fontFamily: template.subtitleFont,
            fontWeight: template.subtitleFontWeight as any,
            fontSize: `${template.subtitleFontSize * scale}px`,
            marginBottom: `${6 * spacingMultiplier * scale}px`,
            color: template.accentColor || template.textColor,
          }}
        >
          {data.dietaryTags.map(getDietaryTagText).join(' • ')}
        </div>
      )}

      {/* Price */}
      {template.showPrice && data.price !== undefined && (
        <div
          style={{
            fontFamily: template.bodyFont,
            fontWeight: template.bodyFontWeight as any,
            fontSize: `${template.bodyFontSize * scale}px`,
            marginBottom: `${4 * spacingMultiplier * scale}px`,
          }}
        >
          £{data.price.toFixed(2)}
        </div>
      )}

      {/* Allergens */}
      {template.showAllergens && data.allergens && data.allergens.length > 0 && (
        <div
          style={{
            fontFamily: template.bodyFont,
            fontWeight: template.bodyFontWeight as any,
            fontSize: `${template.bodyFontSize * scale}px`,
            marginBottom: `${4 * spacingMultiplier * scale}px`,
            maxWidth: '100%',
            wordWrap: 'break-word',
          }}
        >
          Contains: {data.allergens.join(', ')}
        </div>
      )}

      {/* Best Before Date */}
      {template.showDate && data.bestBefore && (
        <div
          style={{
            fontFamily: template.bodyFont,
            fontWeight: template.bodyFontWeight as any,
            fontSize: `${template.bodyFontSize * scale}px`,
            marginBottom: `${4 * spacingMultiplier * scale}px`,
          }}
        >
          Best Before: {data.bestBefore}
        </div>
      )}

      {/* Weight */}
      {template.showWeight && data.weight && (
        <div
          style={{
            fontFamily: template.bodyFont,
            fontWeight: template.bodyFontWeight as any,
            fontSize: `${template.bodyFontSize * scale}px`,
            marginBottom: `${4 * spacingMultiplier * scale}px`,
          }}
        >
          {data.weight}
        </div>
      )}

      {/* Company Name */}
      {template.showCompanyName && data.companyName && (
        <div
          style={{
            fontFamily: template.bodyFont,
            fontWeight: template.bodyFontWeight as any,
            fontSize: `${template.bodyFontSize * scale}px`,
            marginBottom: `${4 * spacingMultiplier * scale}px`,
          }}
        >
          {data.companyName}
        </div>
      )}

      {/* Storage Info */}
      {template.showStorageInfo && data.storageInfo && (
        <div
          style={{
            fontFamily: template.bodyFont,
            fontWeight: template.bodyFontWeight as any,
            fontSize: `${(template.bodyFontSize - 1) * scale}px`,
            fontStyle: 'italic',
            marginTop: `${4 * spacingMultiplier * scale}px`,
          }}
        >
          {data.storageInfo}
        </div>
      )}
    </div>
  );
}
