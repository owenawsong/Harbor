/**
 * Rate Limit Manager Tests
 */

import { RateLimitManager, isRateLimitError, calculateBackoff, parseRetryAfter } from './rateLimitManager'

// ─── Test Helpers ─────────────────────────────────────────────────────────

function testIsRateLimitError() {
  console.log('Testing isRateLimitError...')

  // Test HTTP 429
  const result1 = isRateLimitError(new Error('Request failed'), 429)
  console.assert(result1 === true, 'Should detect 429 status')

  // Test HTTP 503
  const result2 = isRateLimitError(new Error('Service unavailable'), 503)
  console.assert(result2 === true, 'Should detect 503 status')

  // Test error message
  const result3 = isRateLimitError(new Error('Rate limit exceeded'))
  console.assert(result3 === true, 'Should detect rate limit in message')

  // Test quota message
  const result4 = isRateLimitError(new Error('Quota exceeded'))
  console.assert(result4 === true, 'Should detect quota in message')

  // Test header-based detection
  const result5 = isRateLimitError(new Error('Request failed'), undefined, {
    'retry-after': '60',
  })
  console.assert(result5 === true, 'Should detect retry-after header')

  // Test non-rate-limit error
  const result6 = isRateLimitError(new Error('Connection timeout'))
  console.assert(result6 === false, 'Should not detect non-rate-limit error')

  console.log('✅ isRateLimitError tests passed')
}

function testParseRetryAfter() {
  console.log('Testing parseRetryAfter...')

  // Test seconds format
  const result1 = parseRetryAfter('120')
  console.assert(result1 === 120000, 'Should parse seconds format')

  // Test HTTP date format
  const futureDate = new Date(Date.now() + 60000).toUTCString()
  const result2 = parseRetryAfter(futureDate)
  console.assert(result2 !== null && result2 > 0, 'Should parse HTTP date format')

  // Test null input
  const result3 = parseRetryAfter(undefined)
  console.assert(result3 === null, 'Should return null for undefined')

  // Test invalid input
  const result4 = parseRetryAfter('invalid')
  console.assert(result4 === null, 'Should return null for invalid input')

  console.log('✅ parseRetryAfter tests passed')
}

function testCalculateBackoff() {
  console.log('Testing calculateBackoff...')

  const config = {
    initialBackoffMs: 1000,
    maxBackoffMs: 60000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
  }

  // Test first attempt
  const result1 = calculateBackoff(0, config)
  console.assert(result1 >= 1000 && result1 <= 1100, 'First attempt should be ~1s with jitter')

  // Test exponential growth
  const result2 = calculateBackoff(1, config)
  console.assert(result2 >= 2000 && result2 <= 2200, 'Second attempt should be ~2s')

  const result3 = calculateBackoff(5, config)
  console.assert(result3 >= 60000 && result3 <= 66000, 'Should be capped at maxBackoffMs')

  console.log('✅ calculateBackoff tests passed')
}

function testRateLimitManager() {
  console.log('Testing RateLimitManager...')

  const manager = new RateLimitManager()

  // Initial state
  const initialState = manager.getState()
  console.assert(
    initialState.isLimited === false,
    'Should start not limited',
  )

  // Mark as limited
  manager.markLimited(new Error('Rate limit exceeded'), 429)
  const limitedState = manager.getState()
  console.assert(limitedState.isLimited === true, 'Should mark as limited')
  console.assert(limitedState.attemptCount === 1, 'Should increment attempt count')

  // Should retry
  console.assert(manager.shouldRetry() === true, 'Should allow retry for first attempt')

  // Wait until reset time
  const waitMs = manager.getWaitTimeMs()
  console.assert(waitMs > 0, 'Should have positive wait time')

  // Mark as successful
  manager.markSuccess()
  const successState = manager.getState()
  console.assert(successState.isLimited === false, 'Should clear limited state on success')
  console.assert(successState.attemptCount === 0, 'Should reset attempt count')

  // Test max retries
  const managerMaxRetry = new RateLimitManager({ maxRetries: 2 })
  managerMaxRetry.markLimited(new Error('Rate limit'), 429)
  console.assert(managerMaxRetry.shouldRetry() === true, 'First retry allowed')

  managerMaxRetry.markLimited(new Error('Rate limit'), 429)
  console.assert(managerMaxRetry.shouldRetry() === true, 'Second retry allowed')

  managerMaxRetry.markLimited(new Error('Rate limit'), 429)
  console.assert(managerMaxRetry.shouldRetry() === false, 'Third retry denied (max retries)')

  console.log('✅ RateLimitManager tests passed')
}

// ─── Run All Tests ────────────────────────────────────────────────────────

export function runTests() {
  console.log('\n🧪 Running Rate Limit Manager Tests...\n')
  try {
    testIsRateLimitError()
    testParseRetryAfter()
    testCalculateBackoff()
    testRateLimitManager()
    console.log('\n✅ All tests passed!\n')
  } catch (err) {
    console.error('\n❌ Test failed:', err)
  }
}

// Run tests if this module is executed directly
if (typeof window !== 'undefined' && (window as any).runRateLimitTests) {
  runTests()
}
