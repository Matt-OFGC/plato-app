// Validation schemas for authentication
import { z } from 'zod';

// Schema for requesting password reset (email only)
export const requestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Schema for completing password reset (token + password)
export const completePasswordResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Legacy schema for backward compatibility
export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  token: z.string().min(1, 'Token is required').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
}).refine((data) => {
  // Either email (request) or token+password (complete)
  return (data.email && !data.token && !data.password) || 
         (!data.email && data.token && data.password);
}, {
  message: 'Either provide email (for request) or token+password (for completion)',
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  businessType: z.string().optional(),
  country: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});