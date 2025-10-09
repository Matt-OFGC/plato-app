/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Remove special characters
    .replace(/[^\w\s-]/g, '')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique slug by appending a number if needed
 */
export async function generateUniqueSlug(
  baseText: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = generateSlug(baseText);
  let counter = 1;
  
  // Check if slug exists, if so, append number
  while (await checkExists(slug)) {
    slug = `${generateSlug(baseText)}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Map country to currency code
 */
export function getCurrencyFromCountry(country: string): string {
  const currencyMap: Record<string, string> = {
    'United Kingdom': 'GBP',
    'United States': 'USD',
    'Canada': 'CAD',
    'Australia': 'AUD',
    'Ireland': 'EUR',
    'France': 'EUR',
    'Germany': 'EUR',
    'Spain': 'EUR',
    'Italy': 'EUR',
    'Netherlands': 'EUR',
    'Belgium': 'EUR',
    'Portugal': 'EUR',
    'Switzerland': 'CHF',
    'Sweden': 'SEK',
    'Norway': 'NOK',
    'Denmark': 'DKK',
    'Poland': 'PLN',
    'Japan': 'JPY',
    'China': 'CNY',
    'India': 'INR',
    'Singapore': 'SGD',
    'Hong Kong': 'HKD',
    'New Zealand': 'NZD',
    'South Africa': 'ZAR',
    'Brazil': 'BRL',
    'Mexico': 'MXN',
  };

  return currencyMap[country] || 'GBP'; // Default to GBP
}

