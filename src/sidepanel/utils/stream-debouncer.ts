/**
 * Stream Debouncer
 * Batches rapid text delta events to reduce re-renders
 * Debounces over 50ms intervals instead of rendering per-chunk
 */

export interface DebouncedTextDelta {
  type: 'text_delta'
  text: string
  messageId: string
}

export class StreamDebouncer {
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private buffers: Map<string, string> = new Map()
  private onFlush: (delta: DebouncedTextDelta) => void

  constructor(onFlush: (delta: DebouncedTextDelta) => void, private debounceMs: number = 50) {
    this.onFlush = onFlush
  }

  /**
   * Add a text delta to the buffer, debouncing the flush
   */
  addDelta(delta: DebouncedTextDelta): void {
    const messageId = delta.messageId
    const existingTimer = this.timers.get(messageId)

    // Accumulate text
    const currentBuffer = this.buffers.get(messageId) ?? ''
    this.buffers.set(messageId, currentBuffer + delta.text)

    // Clear existing timer
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new debounced flush
    const timer = setTimeout(() => {
      this.flush(messageId)
    }, this.debounceMs)

    this.timers.set(messageId, timer)
  }

  /**
   * Immediately flush pending text for a message
   */
  flush(messageId: string): void {
    const timer = this.timers.get(messageId)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(messageId)
    }

    const bufferedText = this.buffers.get(messageId)
    if (bufferedText && bufferedText.length > 0) {
      this.buffers.delete(messageId)
      this.onFlush({
        type: 'text_delta',
        text: bufferedText,
        messageId,
      })
    }
  }

  /**
   * Flush all pending messages immediately (e.g., on message_complete)
   */
  flushAll(): void {
    for (const messageId of this.buffers.keys()) {
      this.flush(messageId)
    }
  }

  /**
   * Clear all buffers and timers
   */
  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
    this.buffers.clear()
  }

  /**
   * Check if any data is currently buffered
   */
  hasBufferedData(): boolean {
    return this.buffers.size > 0
  }
}
