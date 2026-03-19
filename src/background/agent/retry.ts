/**
 * Rate Limit & Retry Handling
 * Implements exponential backoff for transient failures (429, 5xx errors)
 */

export interface RetryConfig {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 5,
  initialDelayMs: 2000, // 2s
  maxDelayMs: 32000, // 32s
  backoffMultiplier: 2,
}

/**
 * Determine if an error is retriable (transient vs terminal)
 */
export function isRetriableError(statusCode: number): boolean {
  // 429 Too Many Requests - rate limited
  if (statusCode === 429) return true
  // 5xx Server errors - transient
  if (statusCode >= 500 && statusCode < 600) return true
  // 408 Request Timeout
  if (statusCode === 408) return true
  // Terminal errors - should not retry
  // 400, 401, 403, 404, etc.
  return false
}

/**
 * Extract retry-after delay from response headers
 */
export function getRetryAfterDelay(headers: Headers): number | null {
  // Try Retry-After header (can be seconds or HTTP date)
  const retryAfter = headers.get('Retry-After')
  if (!retryAfter) return null

  const seconds = parseInt(retryAfter, 10)
  if (!isNaN(seconds)) {
    return seconds * 1000 // Convert to ms
  }

  // Try parsing as HTTP date
  try {
    const date = new Date(retryAfter)
    const delay = date.getTime() - Date.now()
    return Math.max(delay, 0)
  } catch {
    return null
  }
}

/**
 * Calculate exponential backoff delay with jitter
 */
export function calculateBackoffDelay(attempt: number, config: Required<RetryConfig>): number {
  const exponentialDelay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxDelayMs
  )
  // Add jitter: ±10% of the delay
  const jitter = exponentialDelay * (0.9 + Math.random() * 0.2)
  return Math.round(jitter)
}

/**
 * Retry a fetch operation with exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & { signal?: AbortSignal },
  config: RetryConfig = {}
): Promise<Response> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      const response = await fetch(url, options)

      // If successful or terminal error, return immediately
      if (response.ok || !isRetriableError(response.status)) {
        return response
      }

      // Check if we should retry
      if (attempt === finalConfig.maxAttempts) {
        return response // Return the error response
      }

      // Calculate delay
      let delayMs = calculateBackoffDelay(attempt, finalConfig)
      const retryAfter = getRetryAfterDelay(response.headers)
      if (retryAfter !== null) {
        delayMs = Math.min(retryAfter, delayMs) // Use server's suggestion if shorter
      }

      console.log(
        `🔄 Rate limit detected (${response.status}). Retrying in ${delayMs}ms... (attempt ${attempt}/${finalConfig.maxAttempts})`
      )

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    } catch (err) {
      // Network errors - retry if not the last attempt
      if (attempt === finalConfig.maxAttempts) {
        throw err
      }

      const delayMs = calculateBackoffDelay(attempt, finalConfig)
      console.log(
        `🔄 Network error. Retrying in ${delayMs}ms... (attempt ${attempt}/${finalConfig.maxAttempts})`,
        err instanceof Error ? err.message : err
      )

      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  throw new Error('Retry failed: max attempts exceeded')
}

/**
 * Classify API error type for logging and handling
 */
export interface ErrorClassification {
  type: 'rate_limit' | 'server_error' | 'client_error' | 'network_error' | 'unknown'
  retriable: boolean
  message: string
}

export function classifyError(status: number | null, error: unknown): ErrorClassification {
  if (status === 429) {
    return {
      type: 'rate_limit',
      retriable: true,
      message: 'Rate limited by API provider',
    }
  }

  if (status && status >= 500 && status < 600) {
    return {
      type: 'server_error',
      retriable: true,
      message: `Server error (${status})`,
    }
  }

  if (status && status >= 400 && status < 500) {
    return {
      type: 'client_error',
      retriable: false,
      message: `Client error (${status})`,
    }
  }

  if (error instanceof TypeError) {
    return {
      type: 'network_error',
      retriable: true,
      message: error.message,
    }
  }

  return {
    type: 'unknown',
    retriable: false,
    message: error instanceof Error ? error.message : String(error),
  }
}
