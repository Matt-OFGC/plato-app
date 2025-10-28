// Authentication error handling
export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export function mapAuthError(error: any): AuthError {
  if (error.code === 'P2002') {
    return {
      code: 'DUPLICATE_EMAIL',
      message: 'An account with this email already exists',
      field: 'email'
    };
  }
  
  if (error.message?.includes('Invalid credentials')) {
    return {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
      field: 'password'
    };
  }
  
  if (error.message?.includes('User not found')) {
    return {
      code: 'USER_NOT_FOUND',
      message: 'No account found with this email',
      field: 'email'
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred. Please try again.'
  };
}

export function createAuthErrorResponse(error: AuthError, status: number = 400) {
  return {
    error: error.message,
    code: error.code,
    field: error.field,
    status
  };
}

export function logAuthError(error: any, context: string) {
  console.error(`Auth error in ${context}:`, {
    message: error.message,
    code: error.code,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
}

export function generateErrorId(): string {
  return Math.random().toString(36).substr(2, 9);
}
