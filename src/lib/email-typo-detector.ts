/**
 * Email typo detection utility
 * Suggests corrections for common email domain typos
 */

// Common email domains
const POPULAR_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
];

// Common typos mapped to correct domains
const COMMON_TYPOS: Record<string, string> = {
  // Gmail typos
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmaiil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmeil.com': 'gmail.com',
  'gmaol.com': 'gmail.com',
  'gnail.com': 'gmail.com',

  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'yahho.com': 'yahoo.com',

  // Hotmail typos
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotnail.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',

  // Outlook typos
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',

  // iCloud typos
  'iclod.com': 'icloud.com',
  'icloud.co': 'icloud.com',
  'icoud.com': 'icloud.com',
};

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

export interface EmailTypoSuggestion {
  original: string;
  suggested: string;
  domain: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Check if an email has a potential typo and suggest correction
 */
export function detectEmailTypo(email: string): EmailTypoSuggestion | null {
  if (!email || !email.includes('@')) {
    return null;
  }

  const [localPart, domain] = email.split('@');

  if (!domain || domain.length === 0) {
    return null;
  }

  const lowerDomain = domain.toLowerCase();

  // Check for exact match in common typos
  if (COMMON_TYPOS[lowerDomain]) {
    return {
      original: email,
      suggested: `${localPart}@${COMMON_TYPOS[lowerDomain]}`,
      domain: COMMON_TYPOS[lowerDomain],
      confidence: 'high',
    };
  }

  // Check for similar domains using Levenshtein distance
  let closestDomain: string | null = null;
  let minDistance = Infinity;

  for (const popularDomain of POPULAR_DOMAINS) {
    const distance = levenshteinDistance(lowerDomain, popularDomain);

    // Only suggest if distance is 1-2 characters (likely typo)
    if (distance > 0 && distance <= 2 && distance < minDistance) {
      minDistance = distance;
      closestDomain = popularDomain;
    }
  }

  if (closestDomain && minDistance <= 2) {
    return {
      original: email,
      suggested: `${localPart}@${closestDomain}`,
      domain: closestDomain,
      confidence: minDistance === 1 ? 'high' : 'medium',
    };
  }

  return null;
}

/**
 * Check if domain looks suspicious (missing TLD, etc.)
 */
export function isValidDomainFormat(email: string): boolean {
  if (!email || !email.includes('@')) {
    return false;
  }

  const domain = email.split('@')[1];

  if (!domain) {
    return false;
  }

  // Must have at least one dot
  if (!domain.includes('.')) {
    return false;
  }

  // TLD must be at least 2 characters
  const parts = domain.split('.');
  const tld = parts[parts.length - 1];

  if (tld.length < 2) {
    return false;
  }

  return true;
}
