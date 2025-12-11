import { prisma } from "@/lib/prisma";

/**
 * Generate a default company name from an email address
 */
export function generateDefaultCompanyName(email: string): string {
  const username = email.split('@')[0];
  const cleanName = username
    .replace(/[^a-z0-9]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter of each word
  const capitalized = cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return capitalized || 'My Company';
}

/**
 * Generate a unique slug for a company
 */
export async function generateCompanySlug(companyName: string): Promise<string> {
  const baseSlug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Check if slug exists
  const existing = await prisma.company.findUnique({
    where: { slug: baseSlug },
    select: { id: true }
  });

  if (!existing) {
    return baseSlug;
  }

  // Generate unique slug with random suffix
  const uniqueSlug = baseSlug + '-' + Math.random().toString(36).substr(2, 6);
  return uniqueSlug;
}

/**
 * Get default company data for creating a new company
 */
export function getDefaultCompanyData() {
  return {
    businessType: null,
    country: 'United Kingdom',
    phone: null,
  };
}
