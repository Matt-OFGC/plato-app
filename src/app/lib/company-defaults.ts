import { generateUniqueSlug } from './slug';
import { prisma } from './prisma';

/**
 * Generate a default company name from user email
 */
export function generateDefaultCompanyName(email: string): string {
  // Extract the part before @ and capitalize it
  const emailPrefix = email.split('@')[0];
  // Remove numbers and special chars, capitalize first letter
  const cleaned = emailPrefix
    .replace(/[^a-zA-Z]/g, ' ')
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return cleaned || 'My Company';
}

/**
 * Generate a unique slug for a company name
 */
export async function generateCompanySlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50); // Limit length
  
  // Check if slug exists and add random suffix if needed
  let slug = baseSlug;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const exists = await prisma.company.findUnique({ where: { slug } });
    if (!exists) {
      return slug;
    }
    // Add random suffix
    slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;
    attempts++;
  }
  
  // Fallback: add timestamp
  return `${baseSlug}-${Date.now().toString(36)}`;
}

/**
 * Get default company data for a new company
 */
export function getDefaultCompanyData(name: string, email: string, country: string = 'United Kingdom') {
  return {
    name: name || generateDefaultCompanyName(email),
    country,
    businessType: null,
    phone: null,
    // Other fields will use schema defaults
  };
}
