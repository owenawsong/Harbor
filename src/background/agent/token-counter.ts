/**
 * Token Counting & Context Window Budgeting
 * Estimates token usage and summarizes content when approaching limits
 */

/**
 * Rough estimation of token count using character counting
 * This is a simple approximation - actual tokens depend on the LLM tokenizer
 * Average: 1 token ≈ 4 characters for English text
 */
export function estimateTokenCount(text: string): number {
  // Split by whitespace and count words for better estimation
  const words = text.trim().split(/\s+/).length
  // Average word is ~4-5 characters + 1 space = ~1.3 tokens per word
  return Math.ceil(words * 1.3)
}

/**
 * Count tokens in a structured message
 */
export function countMessageTokens(message: {
  role: string
  content: Array<{ type: string; [key: string]: unknown }>
}): number {
  let total = 0

  // Role adds ~2 tokens
  total += 2

  for (const block of message.content) {
    switch (block.type) {
      case 'text':
        total += estimateTokenCount(String(block.text))
        break

      case 'tool_result':
        // Tool result wrapper
        total += 10
        total += estimateTokenCount(String(block.content))
        break

      case 'tool_call':
        // Tool call metadata
        total += 20
        // Tool name
        total += estimateTokenCount(String(block.name))
        // Tool input (JSON)
        total += Math.ceil(JSON.stringify(block.input).length / 4)
        break

      default:
        total += 5
    }
  }

  return total
}

/**
 * Count total tokens in conversation history
 */
export function countConversationTokens(
  messages: Array<{ role: string; content: Array<{ type: string; [key: string]: unknown }> }>
): number {
  return messages.reduce((sum, msg) => sum + countMessageTokens(msg), 0)
}

export interface ContextWindowBudget {
  maxTokens: number
  currentUsage: number
  remaining: number
  warningThreshold: number
  isNearLimit: boolean
}

/**
 * Calculate remaining context window budget
 */
export function calculateBudget(currentTokens: number, maxTokens: number, warningThreshold: number = 0.8): ContextWindowBudget {
  const remaining = maxTokens - currentTokens
  const isNearLimit = currentTokens / maxTokens >= warningThreshold

  return {
    maxTokens,
    currentUsage: currentTokens,
    remaining,
    warningThreshold,
    isNearLimit,
  }
}

/**
 * Summarize long tool results when context is tight
 */
export function summarizeToolResult(result: string, maxLength: number = 1000): string {
  if (result.length <= maxLength) return result

  // Keep first and last sections
  const firstPart = result.slice(0, Math.floor(maxLength * 0.6))
  const lastPart = result.slice(-Math.floor(maxLength * 0.3))
  const truncation = `\n\n[... ${result.length - (firstPart.length + lastPart.length)} characters omitted ...]\n\n`

  return firstPart + truncation + lastPart
}

/**
 * Truncate HTML snapshot text when context is tight
 */
export function truncateSnapshot(snapshotText: string, maxLength: number = 1500): string {
  if (snapshotText.length <= maxLength) return snapshotText

  // Keep the header (URL, title, element count)
  const lines = snapshotText.split('\n')
  const headerLines = lines.slice(0, 4) // URL, Title, blank line, header
  const elementLines = lines.slice(4)

  // Calculate available space for elements
  const headerLength = headerLines.join('\n').length
  const availableLength = maxLength - headerLength - 100 // reserve for truncation message

  let elementSection = ''
  let elementCount = 0
  for (const line of elementLines) {
    if (elementSection.length + line.length > availableLength) break
    elementSection += line + '\n'
    elementCount++
  }

  const message = `\n[Showing ${elementCount} of ${elementLines.length} elements - context window limit reached]\n`
  return headerLines.join('\n') + '\n' + elementSection + message
}

/**
 * Get memory-saving recommendations
 */
export function getCompressionSuggestions(budget: ContextWindowBudget): string[] {
  const suggestions: string[] = []

  if (budget.isNearLimit) {
    suggestions.push('Context window is getting full. Consider:')
    suggestions.push('- Breaking the task into smaller steps')
    suggestions.push('- Starting a new session')
    suggestions.push('- Using take_snapshot with offset/limit for large pages')
  }

  if (budget.remaining < 2000) {
    suggestions.push('CRITICAL: Very low remaining context. Ending task.')
  }

  return suggestions
}
