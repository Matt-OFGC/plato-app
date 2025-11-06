// Authentication error handling utilities
export function mapAuthError(error: any): string {
  if (error.code === 'P2002') {
    return 'An account with this email already exists';
  }
  if (error.code === 'P2025') {
    return 'User not found';
  }
  if (error.message?.includes('Invalid credentials')) {
    return 'Invalid email or password';
  }
  if (error.message?.includes('Email not verified')) {
    return 'Please verify your email before logging in';
  }
  if (error.message?.includes('Account locked')) {
    return 'Account is temporarily locked. Please try again later';
  }
  return 'An unexpected error occurred. Please try again';
}

export function createAuthErrorResponse(message: string, status: number = 400) {
  return {
    error: message,
    status,
    timestamp: new Date().toISOString(),
  };
}

export function logAuthError(error: any, context: string) {
  console.error(`Auth error in ${context}:`, {
    message: error.message,
    code: error.code,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
}

export function generateErrorId(): string {
  return Math.random().toString(36).substr(2, 9);
}