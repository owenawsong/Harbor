/**
 * Error Parser
 * Parses API responses and raw errors to extract meaningful information.
 * Works with different API formats (JSON, plain text, HTML).
 */

export interface ParsedError {
  message: string
  code?: string | number
  details?: Record<string, unknown>
  originalText: string
}

/**
 * Parses error responses from various API formats.
 */
export function parseErrorResponse(response: string | object | unknown): ParsedError {
  const originalText = typeof response === 'string' ? response : JSON.stringify(response)

  try {
    // Try to parse as JSON
    if (typeof response === 'string') {
      const parsed = JSON.parse(response)
      return parseJSONError(parsed, originalText)
    } else if (typeof response === 'object' && response !== null) {
      return parseJSONError(response, originalText)
    }
  } catch {
    // Not JSON, try other formats
  }

  // Try to extract error from plain text
  return parseTextError(originalText)
}

/**
 * Parses JSON error responses (handles Anthropic, OpenAI, Google, etc. formats).
 */
function parseJSONError(obj: unknown, originalText: string): ParsedError {
  if (typeof obj !== 'object' || obj === null) {
    return { message: String(obj), originalText }
  }

  const errorObj = obj as Record<string, unknown>

  // Anthropic format
  if (errorObj.error && typeof errorObj.error === 'object') {
    const err = errorObj.error as Record<string, unknown>
    return {
      message: String(err.message || 'Unknown Anthropic error'),
      code: err.type || err.code,
      details: { status: errorObj.status, ...err },
      originalText,
    }
  }

  // OpenAI format
  if (errorObj.error && typeof errorObj.error === 'string') {
    return {
      message: String(errorObj.error),
      code: errorObj.code,
      originalText,
    }
  }

  // Google format
  if (errorObj.error && typeof errorObj.error === 'object') {
    const err = errorObj.error as Record<string, unknown>
    return {
      message: String(err.message || 'Unknown Google error'),
      code: err.code,
      details: err,
      originalText,
    }
  }

  // Generic error field
  if (errorObj.message) {
    return {
      message: String(errorObj.message),
      code: errorObj.code || errorObj.error_code,
      details: errorObj,
      originalText,
    }
  }

  // Fallback: return first meaningful field
  for (const [key, value] of Object.entries(errorObj)) {
    if (typeof value === 'string' && value.length > 0 && key.toLowerCase().includes('error')) {
      return {
        message: String(value),
        code: errorObj.code,
        originalText,
      }
    }
  }

  return { message: originalText, originalText }
}

/**
 * Parses text/plain error responses.
 */
function parseTextError(text: string): ParsedError {
  // Extract HTTP status code
  const statusMatch = text.match(/(\d{3})\s+(.+?)(?:\n|$)/i)
  if (statusMatch) {
    const code = parseInt(statusMatch[1])
    const message = statusMatch[2].trim()
    return {
      message,
      code,
      originalText: text,
    }
  }

  // Extract first meaningful line
  const lines = text.split('\n').filter((l) => l.trim().length > 0)
  const message = lines[0]?.substring(0, 200) || text

  return {
    message,
    originalText: text,
  }
}

/**
 * Extracts error message from a thrown Error object.
 */
export function parseErrorThrown(error: unknown): ParsedError {
  if (error instanceof Error) {
    return {
      message: error.message,
      details: {
        name: error.name,
        stack: error.stack,
      },
      originalText: error.toString(),
    }
  }

  if (typeof error === 'string') {
    return parseTextError(error)
  }

  if (typeof error === 'object') {
    return parseErrorResponse(error)
  }

  return {
    message: String(error),
    originalText: String(error),
  }
}

/**
 * Generates a user-friendly error message from a parsed error.
 */
export function generateUserMessage(parsed: ParsedError): string {
  const lines: string[] = []

  if (parsed.code) {
    lines.push(`Error ${parsed.code}:`)
  }

  lines.push(parsed.message)

  // Add relevant details if available
  if (parsed.details) {
    if (typeof parsed.details.message === 'string') {
      lines.push(`Details: ${parsed.details.message}`)
    }
    if (typeof parsed.details.suggestion === 'string') {
      lines.push(`Suggestion: ${parsed.details.suggestion}`)
    }
  }

  return lines.join('\n')
}

/**
 * Extracts retry-after delay from error response.
 */
export function extractRetryAfter(response: unknown): number | null {
  if (typeof response === 'string') {
    const match = response.match(/retry.?after[:\s]+(\d+)/i)
    if (match) {
      return parseInt(match[1]) * 1000
    }
  }

  if (typeof response === 'object' && response !== null) {
    const obj = response as Record<string, unknown>
    if (typeof obj.retry_after === 'number') {
      return obj.retry_after * 1000
    }
    if (typeof obj.retryAfter === 'number') {
      return obj.retryAfter * 1000
    }
  }

  return null
}

/**
 * Checks if error is temporary/transient (can retry).
 */
export function isTemporaryError(error: ParsedError): boolean {
  const msg = error.message.toLowerCase()
  const code = error.code

  // Check code
  if (typeof code === 'number') {
    if (code === 429 || code === 503 || code === 504) return true
    if (code === 500 || code === 502) return true // Server errors usually temporary
    if (code >= 500) return true // 5xx errors
  }

  // Check message
  if (
    msg.includes('temporary') ||
    msg.includes('transient') ||
    msg.includes('retry') ||
    msg.includes('timeout') ||
    msg.includes('throttle') ||
    msg.includes('unavailable') ||
    msg.includes('busy')
  ) {
    return true
  }

  return false
}

/**
 * Checks if error is permanent (shouldn't retry).
 */
export function isPermanentError(error: ParsedError): boolean {
  const msg = error.message.toLowerCase()
  const code = error.code

  // Check code
  if (typeof code === 'number') {
    if (code === 401 || code === 403 || code === 404) return true // Auth/permission/not found
    if (code === 400 || code === 422) return true // Bad request/invalid
  }

  // Check message
  if (
    msg.includes('unauthorized') ||
    msg.includes('forbidden') ||
    msg.includes('not found') ||
    msg.includes('invalid') ||
    msg.includes('malformed') ||
    msg.includes('syntax error')
  ) {
    return true
  }

  return false
}
