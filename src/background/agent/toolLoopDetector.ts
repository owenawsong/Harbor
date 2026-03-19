/**
 * Tool Loop Detector
 * Detects when the agent is repeatedly calling the same tool with identical or near-identical inputs,
 * which indicates a potential infinite loop.
 */

export interface ToolCallSnapshot {
  name: string
  input: Record<string, unknown>
  timestamp: number
}

export interface LoopDetectionConfig {
  windowSize: number // Number of recent tool calls to track
  loopThreshold: number // Min identical calls to trigger detection
  similarityThreshold: number // 0-1: How similar inputs must be (1 = identical)
  timeWindowMs: number // Only consider calls within this time window
}

const DEFAULT_CONFIG: LoopDetectionConfig = {
  windowSize: 10, // Track last 10 tool calls
  loopThreshold: 3, // 3+ identical calls = loop
  similarityThreshold: 0.95, // 95% similar = same
  timeWindowMs: 30000, // Within 30 seconds
}

/**
 * Calculates similarity between two objects (0-1).
 * 1 = identical, 0 = completely different.
 */
function calculateSimilarity(obj1: unknown, obj2: unknown): number {
  if (obj1 === obj2) return 1

  // Convert to JSON for comparison (lossy but practical)
  try {
    const json1 = JSON.stringify(obj1)
    const json2 = JSON.stringify(obj2)

    if (json1 === json2) return 1

    // Levenshtein-like check: count matching characters
    let matches = 0
    const minLen = Math.min(json1.length, json2.length)

    for (let i = 0; i < minLen; i++) {
      if (json1[i] === json2[i]) matches++
    }

    // Similarity = matching chars / average length
    const avgLen = (json1.length + json2.length) / 2
    return avgLen > 0 ? matches / avgLen : 0
  } catch {
    return 0
  }
}

/**
 * Detects tool loops in a sequence of tool calls.
 */
export class ToolLoopDetector {
  private callHistory: ToolCallSnapshot[] = []
  private config: LoopDetectionConfig

  constructor(config?: Partial<LoopDetectionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Record a tool call.
   */
  recordCall(name: string, input: Record<string, unknown>): void {
    const now = Date.now()
    this.callHistory.push({ name, input, timestamp: now })

    // Keep only recent calls within window
    this.callHistory = this.callHistory
      .filter((c) => now - c.timestamp <= this.config.timeWindowMs)
      .slice(-this.config.windowSize)
  }

  /**
   * Check if current call sequence indicates a loop.
   * Returns loop detection info or null if no loop detected.
   */
  detectLoop(): LoopInfo | null {
    if (this.callHistory.length < this.config.loopThreshold) {
      return null
    }

    // Look for repeated calls in recent history
    const recentCalls = this.callHistory.slice(-this.config.loopThreshold)

    // Check if all recent calls are the same tool
    const allSameTool = recentCalls.every((c) => c.name === recentCalls[0].name)
    if (!allSameTool) return null

    // Check input similarity
    const firstInput = recentCalls[0].input
    const similarCalls = recentCalls.filter((c) => {
      const similarity = calculateSimilarity(c.input, firstInput)
      return similarity >= this.config.similarityThreshold
    })

    if (similarCalls.length >= this.config.loopThreshold) {
      return {
        toolName: recentCalls[0].name,
        callCount: similarCalls.length,
        timeWindowMs: recentCalls[recentCalls.length - 1].timestamp - recentCalls[0].timestamp,
        recentInputs: recentCalls.map((c) => c.input),
      }
    }

    return null
  }

  /**
   * Check if adding a new call would create a loop.
   */
  wouldCreateLoop(name: string, input: Record<string, unknown>): boolean {
    this.recordCall(name, input)
    const loop = this.detectLoop()
    return loop !== null
  }

  /**
   * Get loop detection info if a loop exists.
   */
  getLoopInfo(): LoopInfo | null {
    return this.detectLoop()
  }

  /**
   * Clear call history.
   */
  reset(): void {
    this.callHistory = []
  }

  /**
   * Get the call history for debugging.
   */
  getHistory(): ToolCallSnapshot[] {
    return [...this.callHistory]
  }
}

export interface LoopInfo {
  toolName: string
  callCount: number
  timeWindowMs: number
  recentInputs: Record<string, unknown>[]
}
