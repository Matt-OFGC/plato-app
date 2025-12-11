/**
 * Company name validation utilities
 */

export interface CompanyNameValidation {
  valid: boolean;
  sanitized?: string;
  error?: string;
}

/**
 * Validate and sanitize a company name
 */
export function validateCompanyName(name: string): CompanyNameValidation {
  if (!name || typeof name !== 'string') {
    return {
      valid: false,
      error: 'Company name is required',
    };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Company name cannot be empty',
    };
  }

  if (trimmed.length < 2) {
    return {
      valid: false,
      error: 'Company name must be at least 2 characters',
    };
  }

  if (trimmed.length > 100) {
    return {
      valid: false,
      error: 'Company name must be less than 100 characters',
    };
  }

  // Check for invalid characters (allow letters, numbers, spaces, and common punctuation)
  const validPattern = /^[a-zA-Z0-9\s\-&'.,()]+$/;
  if (!validPattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Company name contains invalid characters',
    };
  }

  // Sanitize: remove extra spaces
  const sanitized = trimmed.replace(/\s+/g, ' ');

  return {
    valid: true,
    sanitized,
  };
}

/**
 * Generate a fallback company name from email
 */
export function generateFallbackCompanyName(email: string): string {
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

  return capitalized + ' Company' || 'My Company';
}
