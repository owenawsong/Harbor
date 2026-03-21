/**
 * Rate Limit Manager
 * Handles detection, tracking, and retry logic for API rate limits across different providers.
 */

export interface RateLimitState {
  isLimited: boolean
  retryAfterMs: number
  resetTimeMs: number
  attemptCount: number
  lastError?: string
}

export interface RateLimitConfig {
  maxRetries: number
  initialBackoffMs: number
  maxBackoffMs: number
  backoffMultiplier: number
  jitterFactor: number // 0-1, adds randomness to prevent thundering herd
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRetries: 5,
  initialBackoffMs: 1000, // Start with 1 second
  maxBackoffMs: 60000, // Cap at 60 seconds
  backoffMultiplier: 2,
  jitterFactor: 0.1, // 10% jitter
}

/**
 * Detects if an error is a rate limit error based on HTTP status, error message, or headers.
 */
export function isRateLimitError(
  error: unknown,
  status?: number,
  headers?: Record<string, string>
): boolean {
  // Check if error was marked as rate limited by provider
  if (error instanceof Error && (error as any).__isRateLimited) return true

  // HTTP 429 is standard rate limit status
  if (status === 429) return true

  // HTTP 503 Service Unavailable (sometimes used for rate limiting)
  if (status === 503) return true

  // Check error message for rate limit indicators
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('rate limit') || msg.includes('too many requests')) return true
    if (msg.includes('quota') || msg.includes('throttle')) return true
    if (msg.includes('exceeded')) return true
    if (msg.includes('503')) return true // Check for 503 in error message
    if (msg.includes('429')) return true // Check for 429 in error message
  }

  // Check response headers for rate limit info
  if (headers) {
    const retryAfter = headers['retry-after']
    if (retryAfter) return true

    const rateLimitRemaining = headers['x-ratelimit-remaining']
    if (rateLimitRemaining === '0') return true
  }

  return false
}

/**
 * Parses retry-after header (can be seconds or HTTP date).
 * Returns milliseconds until retry should be attempted.
 */
export function parseRetryAfter(retryAfterHeader?: string): number | null {
  if (!retryAfterHeader) return null

  // Try to parse as seconds (integer)
  const seconds = parseInt(retryAfterHeader, 10)
  if (!isNaN(seconds) && seconds > 0) {
    return seconds * 1000
  }

  // Try to parse as HTTP date
  const date = new Date(retryAfterHeader)
  if (!isNaN(date.getTime())) {
    const delayMs = date.getTime() - Date.now()
    return Math.max(delayMs, 0)
  }

  return null
}

/**
 * Calculates exponential backoff with jitter.
 */
export function calculateBackoff(
  attemptCount: number,
  config: RateLimitConfig
): number {
  const exponentialDelay = Math.min(
    config.initialBackoffMs * Math.pow(config.backoffMultiplier, attemptCount),
    config.maxBackoffMs
  )

  // Add jitter: random value between 0 and jitterFactor% of the delay
  const jitter = exponentialDelay * config.jitterFactor * Math.random()
  return Math.ceil(exponentialDelay + jitter)
}

/**
 * Manages rate limit state and retry logic for a specific provider.
 */
export class RateLimitManager {
  private state: RateLimitState = {
    isLimited: false,
    retryAfterMs: 0,
    resetTimeMs: 0,
    attemptCount: 0,
  }

  private config: RateLimitConfig

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Register a rate limit error and calculate backoff time.
   */
  markLimited(
    error: unknown,
    status?: number,
    headers?: Record<string, string>
  ): void {
    if (!isRateLimitError(error, status, headers)) {
      return
    }

    this.state.isLimited = true
    this.state.attemptCount = (this.state.attemptCount || 0) + 1
    this.state.lastError = error instanceof Error ? error.message : String(error)

    // Try to get retry-after from header
    const retryAfterMs = parseRetryAfter(headers?.['retry-after'])
    if (retryAfterMs !== null) {
      this.state.retryAfterMs = retryAfterMs
      this.state.resetTimeMs = Date.now() + retryAfterMs
    } else {
      // Use exponential backoff if no retry-after header
      const backoff = calculateBackoff(this.state.attemptCount - 1, this.config)
      this.state.retryAfterMs = backoff
      this.state.resetTimeMs = Date.now() + backoff
    }
  }

  /**
   * Mark that a successful request was made, resetting the rate limit state.
   */
  markSuccess(): void {
    this.state = {
      isLimited: false,
      retryAfterMs: 0,
      resetTimeMs: 0,
      attemptCount: 0,
    }
  }

  /**
   * Check if we should retry. Returns false if max retries exceeded.
   */
  shouldRetry(): boolean {
    if (!this.state.isLimited) return false
    if (this.state.attemptCount >= this.config.maxRetries) return false

    // Check if reset time has passed
    if (Date.now() >= this.state.resetTimeMs) {
      this.state.isLimited = false
      return false
    }

    return true
  }

  /**
   * Get milliseconds to wait before next retry.
   */
  getWaitTimeMs(): number {
    return Math.max(0, this.state.resetTimeMs - Date.now())
  }

  /**
   * Get current state.
   */
  getState(): RateLimitState {
    return { ...this.state }
  }

  /**
   * Reset the rate limit state manually.
   */
  reset(): void {
    this.state = {
      isLimited: false,
      retryAfterMs: 0,
      resetTimeMs: 0,
      attemptCount: 0,
    }
  }
}

/**
 * Sleep utility for testing/implementation.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
