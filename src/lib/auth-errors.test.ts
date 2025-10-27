import { mapAuthError, generateErrorId } from '../auth-errors';

describe('Auth Error Mapping', () => {
  test('should map duplicate key error to EMAIL_ALREADY_EXISTS', () => {
    const error = new Error('Unique constraint failed on the constraint: `User_email_key`');
    const errorId = generateErrorId();
    const result = mapAuthError(error, errorId);
    
    expect(result.code).toBe('EMAIL_ALREADY_EXISTS');
    expect(result.message).toBe('That email is already registered. Try logging in or reset your password.');
    expect(result.status).toBe(409);
    expect(result.errorId).toBe(errorId);
  });

  test('should map weak password error to WEAK_PASSWORD', () => {
    const error = new Error('Password is too weak');
    const errorId = generateErrorId();
    const result = mapAuthError(error, errorId);
    
    expect(result.code).toBe('WEAK_PASSWORD');
    expect(result.message).toBe('Please choose a stronger password (8+ chars incl. a number).');
    expect(result.status).toBe(400);
  });

  test('should map rate limit error to RATE_LIMITED', () => {
    const error = new Error('Too many requests');
    const errorId = generateErrorId();
    const result = mapAuthError(error, errorId);
    
    expect(result.code).toBe('RATE_LIMITED');
    expect(result.message).toBe('Too many attempts. Please try again later.');
    expect(result.status).toBe(429);
  });

  test('should map network error to NETWORK_ERROR', () => {
    const error = new Error('Network connection failed');
    const errorId = generateErrorId();
    const result = mapAuthError(error, errorId);
    
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.message).toBe('We couldn\'t complete your request. Please check your connection and try again.');
    expect(result.status).toBe(500);
  });

  test('should map unknown error to UNKNOWN_ERROR', () => {
    const error = new Error('Some random error');
    const errorId = generateErrorId();
    const result = mapAuthError(error, errorId);
    
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('We couldn\'t complete sign-up. Please try again.');
    expect(result.status).toBe(500);
  });

  test('should generate unique error IDs', () => {
    const id1 = generateErrorId();
    const id2 = generateErrorId();
    
    expect(id1).not.toBe(id2);
    expect(id1).toHaveLength(6);
    expect(id2).toHaveLength(6);
  });
});
