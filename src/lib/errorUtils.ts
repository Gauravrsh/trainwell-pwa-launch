/**
 * Error sanitization utilities
 * Prevents exposing internal database details to users
 */

// Map of technical error patterns to user-friendly messages
const errorMappings: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /row-level security/i, message: 'Unable to complete this operation. Please try again.' },
  { pattern: /relation.*does not exist/i, message: 'Service temporarily unavailable. Please try again.' },
  { pattern: /violates.*constraint/i, message: 'Invalid data provided. Please check your input.' },
  { pattern: /duplicate key/i, message: 'This record already exists.' },
  { pattern: /foreign key/i, message: 'Related data not found. Please refresh and try again.' },
  { pattern: /connection|timeout/i, message: 'Connection issue. Please check your internet and try again.' },
  { pattern: /permission denied/i, message: 'You do not have permission to perform this action.' },
  { pattern: /authentication required/i, message: 'Please sign in to continue.' },
  { pattern: /User already registered|already been registered|already exists/i, message: 'An account with this email already exists. Try signing in instead.' },
  { pattern: /Invalid login credentials/i, message: 'Invalid email or password. Please try again.' },
  { pattern: /Email not confirmed/i, message: 'Please confirm your email address before signing in.' },
  { pattern: /email.*rate.*limit|too many.*request/i, message: 'Too many attempts. Please wait a few minutes and try again.' },
];

/**
 * Sanitizes error messages to prevent exposing internal system details.
 * Maps technical errors to user-friendly messages.
 */
export function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = 'Something went wrong. Please try again.';
  
  if (!error) return defaultMessage;
  
  let errorMessage = '';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    errorMessage = String((error as { message: unknown }).message);
  } else {
    return defaultMessage;
  }
  
  // Check against known patterns
  for (const mapping of errorMappings) {
    if (mapping.pattern.test(errorMessage)) {
      return mapping.message;
    }
  }
  
  // For unknown errors, return generic message
  // In development, you might want to see the actual error
  if (import.meta.env.DEV) {
    console.warn('[DEV] Original error:', errorMessage);
  }
  
  return defaultMessage;
}

/**
 * Logs error details for debugging without exposing them to users.
 * Only logs in development or to server-side logging services.
 */
export function logError(context: string, error: unknown): void {
  // In development, log full error details
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
    return;
  }
  
  // In production, log a sanitized version
  // You could also send this to a logging service like Sentry
  console.error(`[${context}] An error occurred`);
}
