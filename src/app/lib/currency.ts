export function formatCurrency(amount: number, currency: string = 'GBP'): string {
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
}

export function formatCurrencyCompact(amount: number, currency: string = 'GBP'): string {
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    notation: amount >= 1000 ? 'compact' : 'standard',
  });
  
  return formatter.format(amount);
}

export function parseCurrency(value: string | number): number {
  if (typeof value === 'number') return value;
  
  // Remove currency symbols and parse
  const cleaned = value.replace(/[£$€¥,\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}
