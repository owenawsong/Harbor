/**
 * Stop Reason Mapping
 * Normalizes provider-specific stop reasons to a unified format
 */

export type NormalizedStopReason = 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence' | 'unknown'

/**
 * Provider-specific stop reason formats:
 * - Anthropic: 'end_turn', 'tool_use', 'max_tokens', 'stop_sequence'
 * - OpenAI: 'stop', 'length', 'function_calls' (deprecated), 'tool_calls'
 * - Google: 'STOP', 'MAX_TOKENS', 'SAFETY' (unblocking), 'OTHER'
 * - Ollama: 'stop', 'length'
 */

export function normalizeStopReason(
  providerName: string,
  rawStopReason: string | null | undefined
): NormalizedStopReason {
  if (!rawStopReason) return 'unknown'

  const normalized = rawStopReason.toLowerCase().trim()

  // ── Anthropic (Claude) ─────────────────────────────────────────────────────
  // Native format: 'end_turn', 'tool_use', 'max_tokens', 'stop_sequence'
  if (normalized === 'end_turn') return 'end_turn'
  if (normalized === 'tool_use') return 'tool_use'
  if (normalized === 'max_tokens') return 'max_tokens'
  if (normalized === 'stop_sequence') return 'stop_sequence'

  // ── OpenAI (GPT models) ────────────────────────────────────────────────────
  if (providerName === 'openai') {
    if (normalized === 'stop') return 'end_turn'
    if (normalized === 'length') return 'max_tokens'
    if (normalized === 'tool_calls' || normalized === 'function_calls') return 'tool_use'
    if (normalized === 'content_filter') return 'stop_sequence' // Safety block
  }

  // ── OpenAI-compatible (Ollama, local, etc) ────────────────────────────────
  if (providerName === 'openai-compatible' || providerName === 'ollama') {
    if (normalized === 'stop') return 'end_turn'
    if (normalized === 'length') return 'max_tokens'
    if (normalized === 'tool_calls' || normalized === 'function_calls') return 'tool_use'
  }

  // ── Google (Gemini) ────────────────────────────────────────────────────────
  // Format: 'STOP', 'MAX_TOKENS', 'SAFETY' (blocked by safety), 'RECITATION' (copyright), 'OTHER'
  if (providerName === 'google') {
    if (normalized === 'stop') return 'end_turn'
    if (normalized === 'max_tokens') return 'max_tokens'
    // SAFETY, RECITATION, OTHER - these should continue trying
    if (normalized === 'finish_reason_unspecified') return 'unknown'
  }

  // ── OpenRouter ─────────────────────────────────────────────────────────────
  // Uses OpenAI-compatible format
  if (providerName === 'openrouter') {
    if (normalized === 'stop') return 'end_turn'
    if (normalized === 'length') return 'max_tokens'
    if (normalized === 'tool_calls' || normalized === 'function_calls') return 'tool_use'
  }

  // ── Poe ────────────────────────────────────────────────────────────────────
  // Uses OpenAI-compatible format under the hood
  if (providerName === 'poe') {
    if (normalized === 'stop') return 'end_turn'
    if (normalized === 'length') return 'max_tokens'
  }

  // ── Harbor Free (NVIDIA NIM) ───────────────────────────────────────────────
  // MiniMax and Qwen models use OpenAI-compatible format
  if (providerName === 'harbor-free') {
    if (normalized === 'stop') return 'end_turn'
    if (normalized === 'length') return 'max_tokens'
    if (normalized === 'tool_calls' || normalized === 'function_calls') return 'tool_use'
  }

  // ── Generic fallback detection for edge cases ──────────────────────────────
  if (normalized.includes('tool') || normalized.includes('function')) return 'tool_use'
  if (normalized.includes('end') || normalized.includes('stop')) return 'end_turn'
  if (normalized.includes('token') || normalized.includes('length') || normalized.includes('max')) return 'max_tokens'

  return 'unknown'
}

/**
 * Determine if model is requesting tool use (more tools should be called)
 */
export function isToolUseReason(normalizedReason: NormalizedStopReason): boolean {
  return normalizedReason === 'tool_use'
}

/**
 * Determine if model has finished (no more tool calls expected)
 */
export function isFinishedReason(normalizedReason: NormalizedStopReason): boolean {
  return normalizedReason === 'end_turn' || normalizedReason === 'stop_sequence'
}

/**
 * Get human-readable description of stop reason
 */
export function getStopReasonDescription(reason: NormalizedStopReason): string {
  const descriptions: Record<NormalizedStopReason, string> = {
    end_turn: 'Model finished responding',
    tool_use: 'Waiting for tool results',
    max_tokens: 'Response truncated (max tokens reached)',
    stop_sequence: 'Model hit stop sequence',
    unknown: 'Unknown stop reason (continuing loop)',
  }
  return descriptions[reason]
}
