/**
 * Tool Loop Detection
 * Detects when agent is repeatedly calling the same tools without progress
 */

interface ToolCallRecord {
  name: string
  input: Record<string, unknown>
  timestamp: number
}

export interface LoopDetectionResult {
  isLooped: boolean
  repeatedToolName?: string
  consecutiveCount?: number
  suggestion?: string
}

/**
 * Detect if agent is stuck in a loop calling the same tool repeatedly
 */
export function detectToolLoop(
  recentToolCalls: ToolCallRecord[],
  threshold: number = 3
): LoopDetectionResult {
  if (recentToolCalls.length < threshold) {
    return { isLooped: false }
  }

  // Look at the last N tool calls
  const window = recentToolCalls.slice(-threshold)

  // Check if all are the same tool
  const toolNames = window.map((tc) => tc.name)
  const uniqueTools = new Set(toolNames)

  if (uniqueTools.size === 1) {
    const toolName = toolNames[0]
    return {
      isLooped: true,
      repeatedToolName: toolName,
      consecutiveCount: window.length,
      suggestion: `Tool "${toolName}" has been called ${threshold}+ times consecutively. Consider a different approach or verify element selectors.`,
    }
  }

  // Check for tight oscillation between 2 tools (e.g., click -> take_snapshot -> click -> ...)
  if (uniqueTools.size === 2) {
    const callSequence = toolNames.join('|')
    const isAlternating = toolNames.every((name, i) => {
      if (i === 0) return true
      return name !== toolNames[i - 1]
    })

    if (isAlternating && window.length >= threshold) {
      return {
        isLooped: true,
        repeatedToolName: `${Array.from(uniqueTools).join(' <-> ')}`,
        consecutiveCount: window.length,
        suggestion: `Agent is alternating between ${Array.from(uniqueTools).join(' and ')}. Consider providing more specific instructions or checking for dynamic content.`,
      }
    }
  }

  return { isLooped: false }
}

/**
 * Check if same tool is being called with identical or very similar inputs
 */
export function isSameTooInputl(
  toolCall1: ToolCallRecord,
  toolCall2: ToolCallRecord,
  similarityThreshold: number = 0.9
): boolean {
  if (toolCall1.name !== toolCall2.name) return false

  const input1 = JSON.stringify(toolCall1.input)
  const input2 = JSON.stringify(toolCall2.input)

  // Exact match
  if (input1 === input2) return true

  // Calculate similarity (simple Levenshtein-like comparison)
  const similarity = calculateStringSimilarity(input1, input2)
  return similarity >= similarityThreshold
}

/**
 * Simple string similarity calculation (0 to 1)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1
  const editDistance = getEditDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Levenshtein distance (for similarity calculation)
 */
function getEditDistance(s1: string, s2: string): number {
  const costs = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }
  return costs[s2.length]
}

/**
 * Suggest a strategy change based on loop type
 */
export function getSuggestionForLoop(toolName: string | undefined): string {
  if (!toolName) return 'Unable to recover from tool loop.'

  if (toolName.includes('<->')) {
    return 'Try providing explicit navigation URLs, checkpoints (take_snapshot), or re-take snapshots to verify state changes.'
  }

  if (toolName === 'click' || toolName === 'fill_input') {
    return 'Verify the element selector is correct and the element is interactable. Use take_snapshot first to see current state.'
  }

  if (toolName === 'take_snapshot') {
    return 'Page content may be loading slowly. Add delays between operations or use evaluate_script to check page readiness.'
  }

  return `Tool "${toolName}" is being called repeatedly. Try a different approach or break the task into smaller steps.`
}
