/**
 * Performance Optimizer
 * Caches responses, chunks large data, and optimizes agent loops.
 */

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttlMs: number
}

export interface ChunkOptions {
  maxChunkSize: number
  separator?: string
  preserveContext: boolean
}

const DEFAULT_CHUNK_OPTIONS: ChunkOptions = {
  maxChunkSize: 4096, // 4KB per chunk
  separator: '\n\n',
  preserveContext: true,
}

/**
 * Simple LRU cache for API responses.
 */
export class ResponseCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private maxSize: number
  private defaultTTL: number

  constructor(maxSize: number = 100, defaultTTLMs: number = 300000) {
    // 5 minute default TTL
    this.maxSize = maxSize
    this.defaultTTL = defaultTTLMs
  }

  /**
   * Get cached value if not expired.
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttlMs) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set cached value with TTL.
   */
  set(key: string, data: T, ttlMs?: number): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs: ttlMs ?? this.defaultTTL,
    })
  }

  /**
   * Clear all cached entries.
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache size.
   */
  size(): number {
    return this.cache.size
  }
}

/**
 * Chunks large text into smaller pieces for processing.
 */
export function chunkText(text: string, options?: Partial<ChunkOptions>): string[] {
  const opts = { ...DEFAULT_CHUNK_OPTIONS, ...options }

  if (text.length <= opts.maxChunkSize) {
    return [text]
  }

  const chunks: string[] = []
  let current = ''

  const lines = text.split(opts.separator || '\n')

  for (const line of lines) {
    if ((current + line + opts.separator).length > opts.maxChunkSize) {
      if (current) {
        chunks.push(current.trim())
      }
      current = line
    } else {
      current += (current ? (opts.separator || '\n') : '') + line
    }
  }

  if (current) {
    chunks.push(current.trim())
  }

  return chunks
}

/**
 * Generates cache key from request parameters.
 */
export function generateCacheKey(tool: string, input: Record<string, unknown>): string {
  // Create deterministic key from tool and input
  const inputStr = JSON.stringify(input, Object.keys(input).sort())
  return `${tool}:${inputStr}`
}

/**
 * Debouncer for high-frequency operations.
 */
export class Debouncer<T extends (...args: unknown[]) => Promise<unknown>> {
  private timeoutId: NodeJS.Timeout | null = null
  private lastArgs: unknown[] | null = null

  constructor(private fn: T, private delayMs: number) {}

  /**
   * Call with automatic debouncing.
   */
  async call(...args: unknown[]): Promise<unknown> {
    this.lastArgs = args

    return new Promise((resolve) => {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId)
      }

      this.timeoutId = setTimeout(() => {
        if (this.lastArgs === args) {
          resolve(this.fn(...args))
        }
      }, this.delayMs)
    })
  }

  /**
   * Cancel pending calls.
   */
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }
}

/**
 * Batch processor for handling multiple operations efficiently.
 */
export class BatchProcessor<T, R> {
  private batch: T[] = []
  private timeoutId: NodeJS.Timeout | null = null

  constructor(
    private processor: (batch: T[]) => Promise<R[]>,
    private maxBatchSize: number = 10,
    private maxWaitMs: number = 1000
  ) {}

  /**
   * Add item to batch.
   */
  async add(item: T): Promise<R> {
    this.batch.push(item)

    if (this.batch.length >= this.maxBatchSize) {
      return this.flush()[0]
    }

    // Schedule flush if not already scheduled
    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => this.flush(), this.maxWaitMs)
    }

    // Wait for batch to be processed
    return new Promise((resolve) => {
      const checkBatch = () => {
        if (this.batch.length === 0) {
          resolve(undefined as unknown as R) // Simplified
        } else {
          setTimeout(checkBatch, 10)
        }
      }
      checkBatch()
    })
  }

  /**
   * Process pending batch immediately.
   */
  async flush(): Promise<R[]> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    if (this.batch.length === 0) {
      return []
    }

    const currentBatch = this.batch
    this.batch = []

    return this.processor(currentBatch)
  }
}

/**
 * Memoizes function results based on arguments.
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ttlMs: number = 300000
): T {
  const cache = new ResponseCache<unknown>(50, ttlMs)

  return ((...args: unknown[]) => {
    const key = JSON.stringify(args)
    const cached = cache.get(key)

    if (cached !== null) {
      return cached
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}
