/**
 * Company templates/presets for different business types
 */

export interface CompanyTemplate {
  id: string;
  name: string;
  description: string;
  businessType: string;
  country: string;
  defaults: {
    businessType: string;
    country: string;
    currency?: string;
    settings?: Record<string, any>;
  };
}

export const COMPANY_TEMPLATES: CompanyTemplate[] = [
  {
    id: "bakery",
    name: "Bakery",
    description: "Perfect for bakeries, patisseries, and cake shops",
    businessType: "Bakery",
    country: "United Kingdom",
    defaults: {
      businessType: "Bakery",
      country: "United Kingdom",
      currency: "GBP",
    },
  },
  {
    id: "restaurant",
    name: "Restaurant",
    description: "Ideal for restaurants and cafes",
    businessType: "Restaurant",
    country: "United Kingdom",
    defaults: {
      businessType: "Restaurant",
      country: "United Kingdom",
      currency: "GBP",
    },
  },
  {
    id: "cafe",
    name: "Café",
    description: "Great for coffee shops and cafes",
    businessType: "Café",
    country: "United Kingdom",
    defaults: {
      businessType: "Café",
      country: "United Kingdom",
      currency: "GBP",
    },
  },
  {
    id: "catering",
    name: "Catering",
    description: "For catering businesses and event planners",
    businessType: "Catering",
    country: "United Kingdom",
    defaults: {
      businessType: "Catering",
      country: "United Kingdom",
      currency: "GBP",
    },
  },
  {
    id: "food-truck",
    name: "Food Truck",
    description: "Perfect for mobile food businesses",
    businessType: "Food Truck",
    country: "United Kingdom",
    defaults: {
      businessType: "Food Truck",
      country: "United Kingdom",
      currency: "GBP",
    },
  },
  {
    id: "hotel",
    name: "Hotel",
    description: "For hotels with food service",
    businessType: "Hotel",
    country: "United Kingdom",
    defaults: {
      businessType: "Hotel",
      country: "United Kingdom",
      currency: "GBP",
    },
  },
  {
    id: "bar-pub",
    name: "Bar & Pub",
    description: "For bars, pubs, and gastropubs",
    businessType: "Bar & Pub",
    country: "United Kingdom",
    defaults: {
      businessType: "Bar & Pub",
      country: "United Kingdom",
      currency: "GBP",
    },
  },
];

/**
 * Get template by ID
 */
export function getCompanyTemplate(templateId: string): CompanyTemplate | null {
  return COMPANY_TEMPLATES.find(t => t.id === templateId) || null;
}

/**
 * Get all templates
 */
export function getAllCompanyTemplates(): CompanyTemplate[] {
  return COMPANY_TEMPLATES;
}

/**
 * Apply template defaults to company data
 */
export function applyTemplateDefaults(
  template: CompanyTemplate,
  baseData: {
    name: string;
    email: string;
  }
): {
  name: string;
  businessType: string;
  country: string;
  phone?: string;
} {
  return {
    name: baseData.name,
    businessType: template.defaults.businessType,
    country: template.defaults.country,
  };
}
