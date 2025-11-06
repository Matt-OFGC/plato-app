// Slug generation utilities
export function generateUniqueSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    + '-' + Math.random().toString(36).substr(2, 6);
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