import { z } from 'zod';

/**
 * Company name validation and sanitization
 */
export function validateCompanyName(name: string): { valid: boolean; sanitized?: string; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Company name cannot be empty' };
  }

  // Remove leading/trailing whitespace
  const sanitized = name.trim();

  // Check minimum length
  if (sanitized.length < 2) {
    return { valid: false, error: 'Company name must be at least 2 characters' };
  }

  // Check maximum length
  if (sanitized.length > 100) {
    return { valid: false, error: 'Company name must be less than 100 characters' };
  }

  // Check for potentially problematic characters (prevent XSS)
  const dangerousPatterns = /<script|javascript:|onerror=|onload=/i;
  if (dangerousPatterns.test(sanitized)) {
    return { valid: false, error: 'Company name contains invalid characters' };
  }

  // Check for SQL injection patterns (basic check)
  const sqlPatterns = /('|(\\')|(;)|(--)|(\*)|(\/\*)|(\*\/)|(\+)|(\%27)|(\%3B)|(\%2D)|(\%2A))/i;
  if (sqlPatterns.test(sanitized)) {
    return { valid: false, error: 'Company name contains invalid characters' };
  }

  return { valid: true, sanitized };
}

/**
 * Zod schema for company name validation
 */
export const companyNameSchema = z
  .string()
  .min(2, 'Company name must be at least 2 characters')
  .max(100, 'Company name must be less than 100 characters')
  .refine(
    (name) => {
      const result = validateCompanyName(name);
      return result.valid;
    },
    { message: 'Company name contains invalid characters' }
  )
  .transform((name) => name.trim());

/**
 * Generate fallback company name if validation fails
 */
export function generateFallbackCompanyName(email: string): string {
  const emailPrefix = email.split('@')[0];
  const cleaned = emailPrefix
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return cleaned || 'My Company';
}
