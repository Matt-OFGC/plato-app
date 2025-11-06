// Password policy validation
import { z } from 'zod';

export interface PasswordStrength {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  feedback: string[];
  meetsRequirements: boolean;
}

// Password strength requirements
const MIN_LENGTH = 8;
const REQUIRE_UPPERCASE = true;
const REQUIRE_LOWERCASE = true;
const REQUIRE_NUMBER = true;
const REQUIRE_SPECIAL = false; // Optional but recommended

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= MIN_LENGTH) {
    score += 1;
  } else {
    feedback.push(`Password must be at least ${MIN_LENGTH} characters long`);
  }

  // Character variety checks
  if (REQUIRE_UPPERCASE && /[A-Z]/.test(password)) {
    score += 1;
  } else if (REQUIRE_UPPERCASE) {
    feedback.push('Password should contain at least one uppercase letter');
  }

  if (REQUIRE_LOWERCASE && /[a-z]/.test(password)) {
    score += 1;
  } else if (REQUIRE_LOWERCASE) {
    feedback.push('Password should contain at least one lowercase letter');
  }

  if (REQUIRE_NUMBER && /\d/.test(password)) {
    score += 1;
  } else if (REQUIRE_NUMBER) {
    feedback.push('Password should contain at least one number');
  }

  if (REQUIRE_SPECIAL && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else if (REQUIRE_SPECIAL) {
    feedback.push('Password should contain at least one special character');
  }

  // Bonus for longer passwords
  if (password.length >= 12) {
    score = Math.min(score + 1, 4);
  }

  const meetsRequirements = 
    password.length >= MIN_LENGTH &&
    (!REQUIRE_UPPERCASE || /[A-Z]/.test(password)) &&
    (!REQUIRE_LOWERCASE || /[a-z]/.test(password)) &&
    (!REQUIRE_NUMBER || /\d/.test(password)) &&
    (!REQUIRE_SPECIAL || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password));

  return {
    score,
    feedback: feedback.length > 0 ? feedback : ['Password meets all requirements'],
    meetsRequirements,
  };
}

// Zod schema for password validation
export const passwordSchema = z
  .string()
  .min(MIN_LENGTH, `Password must be at least ${MIN_LENGTH} characters`)
  .refine(
    (password) => {
      const strength = validatePasswordStrength(password);
      return strength.meetsRequirements;
    },
    {
      message: 'Password does not meet strength requirements',
    }
  );

// Check if password is too common (basic check)
const COMMON_PASSWORDS = [
  'password',
  'password123',
  '12345678',
  'qwerty',
  'abc123',
  'letmein',
  'welcome',
  'admin',
];

export function isCommonPassword(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  return COMMON_PASSWORDS.some((common) => lowerPassword.includes(common));
}

