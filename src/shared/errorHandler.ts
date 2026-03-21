/**
 * Error Handler - Improved error messages and recovery
 */

export interface AppError {
  code: string
  message: string
  userMessage: string
  details?: Record<string, unknown>
  recoverable: boolean
}

export class AppErrorClass extends Error implements AppError {
  code: string
  userMessage: string
  details?: Record<string, unknown>
  recoverable: boolean

  constructor(code: string, message: string, userMessage: string, recoverable = false, details?: Record<string, unknown>) {
    super(message)
    this.code = code
    this.userMessage = userMessage
    this.recoverable = recoverable
    this.details = details
    this.name = 'AppError'
  }
}

// Categorized error handlers with helpful messages

export const ErrorMessages = {
  // API/Provider errors
  API_UNAUTHORIZED: {
    code: 'API_UNAUTHORIZED',
    message: 'API authentication failed',
    userMessage: 'Invalid API key. Please check your provider settings.',
    recoverable: true,
  },
  API_QUOTA_EXCEEDED: {
    code: 'API_QUOTA_EXCEEDED',
    message: 'API quota exceeded',
    userMessage: 'You\'ve exceeded your API quota. Check your provider account or try again later.',
    recoverable: false,
  },
  API_TIMEOUT: {
    code: 'API_TIMEOUT',
    message: 'API request timed out',
    userMessage: 'Request took too long. Check your internet connection and try again.',
    recoverable: true,
  },
  API_NETWORK_ERROR: {
    code: 'API_NETWORK_ERROR',
    message: 'Network error calling API',
    userMessage: 'Network error. Check your internet connection and try again.',
    recoverable: true,
  },

  // Tool execution errors
  TOOL_EXECUTION_FAILED: {
    code: 'TOOL_EXECUTION_FAILED',
    message: 'Tool execution failed',
    userMessage: 'Failed to execute action. The page may be blocking automation.',
    recoverable: true,
  },
  SELECTOR_NOT_FOUND: {
    code: 'SELECTOR_NOT_FOUND',
    message: 'DOM element not found',
    userMessage: 'Could not find the target element. The page structure may have changed.',
    recoverable: true,
  },
  TAB_NOT_FOUND: {
    code: 'TAB_NOT_FOUND',
    message: 'Tab no longer exists',
    userMessage: 'The browser tab was closed. Open a new tab and try again.',
    recoverable: true,
  },

  // Configuration errors
  MISSING_API_KEY: {
    code: 'MISSING_API_KEY',
    message: 'API key not configured',
    userMessage: 'API key not configured. Visit Settings to add your provider key.',
    recoverable: true,
  },
  INVALID_MODEL: {
    code: 'INVALID_MODEL',
    message: 'Invalid model selected',
    userMessage: 'Invalid model. Check your Settings and select a valid model.',
    recoverable: true,
  },

  // Storage/Data errors
  STORAGE_QUOTA_EXCEEDED: {
    code: 'STORAGE_QUOTA_EXCEEDED',
    message: 'Storage quota exceeded',
    userMessage: 'Storage is full. Delete old conversations or export data to free space.',
    recoverable: true,
  },
  STORAGE_ERROR: {
    code: 'STORAGE_ERROR',
    message: 'Storage operation failed',
    userMessage: 'Failed to save data. Try refreshing the page.',
    recoverable: true,
  },

  // General errors
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'Unknown error occurred',
    userMessage: 'Something went wrong. Try refreshing the page or clearing your data.',
    recoverable: true,
  },
}

export function parseError(error: unknown): AppError {
  // If it's already an AppError, return it
  if (error instanceof AppErrorClass) {
    return error
  }

  // If it's a network error
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    const errorMsg = ErrorMessages.API_NETWORK_ERROR
    return new AppErrorClass(
      errorMsg.code,
      error.message,
      errorMsg.userMessage,
      errorMsg.recoverable,
    )
  }

  // Check for timeout patterns
  if (error instanceof Error && error.message.toLowerCase().includes('timeout')) {
    const errorMsg = ErrorMessages.API_TIMEOUT
    return new AppErrorClass(
      errorMsg.code,
      error.message,
      errorMsg.userMessage,
      errorMsg.recoverable,
    )
  }

  // Check for quota exceeded patterns
  if (error instanceof Error && error.message.toLowerCase().includes('quota')) {
    const errorMsg = ErrorMessages.API_QUOTA_EXCEEDED
    return new AppErrorClass(
      errorMsg.code,
      error.message,
      errorMsg.userMessage,
      errorMsg.recoverable,
    )
  }

  // Check for auth errors
  if (error instanceof Error && (error.message.toLowerCase().includes('unauthorized') || error.message.toLowerCase().includes('authentication'))) {
    const errorMsg = ErrorMessages.API_UNAUTHORIZED
    return new AppErrorClass(
      errorMsg.code,
      error.message,
      errorMsg.userMessage,
      errorMsg.recoverable,
    )
  }

  // Generic error message
  const genericMsg = ErrorMessages.UNKNOWN_ERROR
  const message = error instanceof Error ? error.message : String(error)
  return new AppErrorClass(
    genericMsg.code,
    message,
    genericMsg.userMessage,
    genericMsg.recoverable,
  )
}

export function logError(error: unknown, context?: string): void {
  const appError = parseError(error)
  console.error(
    `[${appError.code}]${context ? ` (${context})` : ''}: ${appError.message}`,
    appError.details,
  )
}
