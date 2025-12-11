// Slug generation utilities
export async function generateUniqueSlug(
  name: string,
  checkExists?: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50); // Limit length
  
  // If no check function provided, use default with random suffix
  if (!checkExists) {
    return `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;
  }
  
  // Check if slug exists and add random suffix if needed
  let slug = baseSlug;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const exists = await checkExists(slug);
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

export function getCurrencyFromCountry(country: string): string {
  const currencyMap: Record<string, string> = {
    'US': 'USD',
    'GB': 'GBP',
    'CA': 'CAD',
    'AU': 'AUD',
    'DE': 'EUR',
    'FR': 'EUR',
    'IT': 'EUR',
    'ES': 'EUR',
    'NL': 'EUR',
    'BE': 'EUR',
    'AT': 'EUR',
    'PT': 'EUR',
    'IE': 'EUR',
    'FI': 'EUR',
    'LU': 'EUR',
    'GR': 'EUR',
    'CY': 'EUR',
    'MT': 'EUR',
    'SI': 'EUR',
    'SK': 'EUR',
    'EE': 'EUR',
    'LV': 'EUR',
    'LT': 'EUR',
  };
  
  return currencyMap[country] || 'GBP';
}