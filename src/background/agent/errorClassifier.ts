/**
 * Error Classifier
 * Categorizes errors by type and severity, enabling targeted handling and user-friendly messages.
 */

export type ErrorCategory =
  | 'rate_limit'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'invalid_input'
  | 'tool_timeout'
  | 'network'
  | 'parse_error'
  | 'resource_exhausted'
  | 'service_unavailable'
  | 'unknown'

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface ClassifiedError {
  category: ErrorCategory
  severity: ErrorSeverity
  originalError: Error | string
  message: string
  retryable: boolean
  suggestedAction: string
}

const ERROR_PATTERNS: Array<{
  patterns: RegExp[]
  category: ErrorCategory
  severity: ErrorSeverity
  retryable: boolean
}> = [
  {
    patterns: [/rate limit|too many requests|quota exceeded|throttle/i],
    category: 'rate_limit',
    severity: 'warning',
    retryable: true,
  },
  {
    patterns: [/401|unauthorized|invalid api key|authentication failed/i],
    category: 'authentication',
    severity: 'error',
    retryable: false,
  },
  {
    patterns: [/403|forbidden|access denied|permission denied/i],
    category: 'authorization',
    severity: 'error',
    retryable: false,
  },
  {
    patterns: [/404|not found|does not exist/i],
    category: 'not_found',
    severity: 'warning',
    retryable: false,
  },
  {
    patterns: [/invalid|malformed|syntax error|bad request|400/i],
    category: 'invalid_input',
    severity: 'error',
    retryable: false,
  },
  {
    patterns: [/timeout|timed out/i],
    category: 'tool_timeout',
    severity: 'warning',
    retryable: true,
  },
  {
    patterns: [/network|connection|econnrefused|enotfound|dns/i],
    category: 'network',
    severity: 'warning',
    retryable: true,
  },
  {
    patterns: [/parse|json|xml|decode/i],
    category: 'parse_error',
    severity: 'error',
    retryable: false,
  },
  {
    patterns: [/memory|resources|out of memory|disk full/i],
    category: 'resource_exhausted',
    severity: 'critical',
    retryable: true,
  },
  {
    patterns: [/service unavailable|503|maintenance|down/i],
    category: 'service_unavailable',
    severity: 'warning',
    retryable: true,
  },
]

/**
 * Classifies an error message by type.
 */
export function classifyError(error: Error | string): ClassifiedError {
  const errorStr = error instanceof Error ? error.message : error
  const lowerError = errorStr.toLowerCase()

  // Find matching pattern
  let category: ErrorCategory = 'unknown'
  let severity: ErrorSeverity = 'error'
  let retryable = false

  for (const { patterns, category: cat, severity: sev, retryable: retry } of ERROR_PATTERNS) {
    if (patterns.some((p) => p.test(lowerError))) {
      category = cat
      severity = sev
      retryable = retry
      break
    }
  }

  const message = generateErrorMessage(category, errorStr)
  const suggestedAction = generateSuggestedAction(category, retryable)

  return {
    category,
    severity,
    originalError: error,
    message,
    retryable,
    suggestedAction,
  }
}

/**
 * Generates a user-friendly error message.
 */
function generateErrorMessage(category: ErrorCategory, originalMsg: string): string {
  const messages: Record<ErrorCategory, (msg: string) => string> = {
    rate_limit: (msg) => `Rate limited by API. The system will automatically retry. (${msg})`,
    authentication: (msg) => `Authentication failed. Please check your API key in settings.`,
    authorization: (msg) => `Access denied. You may not have permission for this action.`,
    not_found: (msg) => `Resource not found. The target may have been deleted or doesn't exist.`,
    invalid_input: (msg) => `Invalid input provided. Please check the parameters.`,
    tool_timeout: (msg) => `Tool execution timed out. The system will retry.`,
    network: (msg) => `Network error. Checking connection...`,
    parse_error: (msg) => `Failed to parse response. The API may have returned unexpected data.`,
    resource_exhausted: (msg) => `System resources exhausted. Please try again later.`,
    service_unavailable: (msg) => `Service unavailable. The API may be down for maintenance.`,
    unknown: (msg) => `An unexpected error occurred: ${msg}`,
  }

  return messages[category](originalMsg)
}

/**
 * Generates a suggested action based on error category.
 */
function generateSuggestedAction(category: ErrorCategory, retryable: boolean): string {
  const actions: Record<ErrorCategory, string> = {
    rate_limit: 'The system will automatically retry with exponential backoff.',
    authentication: 'Update your API key in Settings → Provider Configuration',
    authorization: 'Check that your API key has the necessary permissions.',
    not_found: 'Verify the resource exists or try a different target.',
    invalid_input: 'Review the tool parameters and try again.',
    tool_timeout: 'The system will retry automatically. If persistent, try a simpler task.',
    network: 'Check your internet connection and try again.',
    parse_error: 'Try again. If the problem persists, contact support.',
    resource_exhausted: 'Close other tabs/apps and try again.',
    service_unavailable: 'Try again in a few moments. The service may be restarting.',
    unknown: 'Try again or contact support if the problem persists.',
  }

  return actions[category]
}

/**
 * Checks if an error is retryable.
 */
export function isRetryable(error: Error | string): boolean {
  return classifyError(error).retryable
}

/**
 * Checks error severity.
 */
export function getErrorSeverity(error: Error | string): ErrorSeverity {
  return classifyError(error).severity
}

/**
 * Checks if error is critical (requires user intervention).
 */
export function isCriticalError(error: Error | string): boolean {
  return classifyError(error).severity === 'critical'
}
