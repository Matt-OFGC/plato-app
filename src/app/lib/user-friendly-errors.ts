/**
 * User-friendly error messages and recovery actions
 * Provides actionable error messages for better UX
 */

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  suggestions?: string[];
}

/**
 * Map technical errors to user-friendly messages
 */
export function getUserFriendlyError(error: unknown, context?: string): UserFriendlyError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
    return {
      title: 'Connection Problem',
      message: 'We couldn\'t connect to our servers. Please check your internet connection and try again.',
      action: {
        label: 'Try Again',
        onClick: () => window.location.reload(),
      },
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'If the problem persists, contact support',
      ],
    };
  }

  // Authentication errors
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('not authenticated') || lowerMessage.includes('session')) {
    return {
      title: 'Session Expired',
      message: 'Your session has expired. Please sign in again to continue.',
      action: {
        label: 'Sign In',
        href: '/login',
      },
      suggestions: [
        'Your session may have expired due to inactivity',
        'Sign in again to continue working',
      ],
    };
  }

  // Permission errors
  if (lowerMessage.includes('forbidden') || lowerMessage.includes('permission') || lowerMessage.includes('access denied')) {
    return {
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action. Contact your team administrator if you need access.',
      action: {
        label: 'Go to Dashboard',
        href: '/dashboard',
      },
      suggestions: [
        'Check with your team owner or admin for access',
        'Verify you\'re signed in to the correct account',
      ],
    };
  }

  // Validation errors
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid') || lowerMessage.includes('required')) {
    return {
      title: 'Invalid Input',
      message: 'Please check your input and try again. Make sure all required fields are filled correctly.',
      suggestions: [
        'Review the highlighted fields',
        'Check for typos or missing information',
        'Ensure all required fields are completed',
      ],
    };
  }

  // Rate limiting
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many')) {
    return {
      title: 'Too Many Requests',
      message: 'You\'re making requests too quickly. Please wait a moment and try again.',
      suggestions: [
        'Wait a few seconds before trying again',
        'Avoid clicking buttons multiple times',
      ],
    };
  }

  // Not found errors
  if (lowerMessage.includes('not found') || lowerMessage.includes('does not exist')) {
    return {
      title: 'Not Found',
      message: 'The item you\'re looking for doesn\'t exist or may have been deleted.',
      action: {
        label: 'Go Back',
        onClick: () => window.history.back(),
      },
      suggestions: [
        'Check if the item was deleted',
        'Verify you have access to view this item',
        'Try navigating from the main menu',
      ],
    };
  }

  // Database errors
  if (lowerMessage.includes('database') || lowerMessage.includes('prisma') || lowerMessage.includes('query')) {
    return {
      title: 'Server Error',
      message: 'We encountered an issue processing your request. Our team has been notified.',
      action: {
        label: 'Reload Page',
        onClick: () => window.location.reload(),
      },
      suggestions: [
        'Try refreshing the page',
        'If the problem persists, contact support',
        'Check our status page for service updates',
      ],
    };
  }

  // File upload errors
  if (lowerMessage.includes('file') || lowerMessage.includes('upload') || lowerMessage.includes('size')) {
    if (lowerMessage.includes('too large') || lowerMessage.includes('size')) {
      return {
        title: 'File Too Large',
        message: 'The file you\'re trying to upload is too large. Please use a smaller file.',
        suggestions: [
          'Compress images before uploading',
          'Use files under 5MB',
          'Try a different file format',
        ],
      };
    }
    return {
      title: 'Upload Failed',
      message: 'We couldn\'t upload your file. Please try again.',
      action: {
        label: 'Try Again',
      },
      suggestions: [
        'Check your internet connection',
        'Verify the file format is supported',
        'Try a different file',
      ],
    };
  }

  // Email errors
  if (lowerMessage.includes('email') || lowerMessage.includes('send')) {
    return {
      title: 'Email Error',
      message: 'We couldn\'t send the email. Please try again or contact support if the problem persists.',
      suggestions: [
        'Check the email address is correct',
        'Try again in a few moments',
        'Contact support if emails continue to fail',
      ],
    };
  }

  // Generic error
  return {
    title: 'Something Went Wrong',
    message: 'We encountered an unexpected error. Please try again, or contact support if the problem continues.',
    action: {
      label: 'Try Again',
      onClick: () => window.location.reload(),
    },
    suggestions: [
      'Refresh the page and try again',
      'Check your internet connection',
      'Contact support if the problem persists',
    ],
  };
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(error: unknown, context?: string): UserFriendlyError {
  return getUserFriendlyError(error, context);
}







