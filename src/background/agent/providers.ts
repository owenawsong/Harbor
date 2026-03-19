/**
 * AI Provider Adapters
 * Each provider implements the ProviderAdapter interface with streaming support.
 * Uses direct fetch calls for Chrome extension compatibility.
 */

import type { ProviderAdapter, CompletionOptions, CompletionEvent, NormalizedMessage } from './types'
import type { ToolDefinition } from '../../shared/types'
import { fetchWithRetry, classifyError } from './retry'

// ─── SSE Parser ───────────────────────────────────────────────────────────────

async function* parseSSE(response: Response, signal?: AbortSignal): AsyncGenerator<string> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  // Cancel reader when signal aborts
  signal?.addEventListener('abort', () => { reader.cancel() }, { once: true })

  try {
    while (true) {
      if (signal?.aborted) break
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') return
          if (data) yield data
        }
      }
    }
  } finally {
    reader.cancel().catch(() => {})
  }
}

// ─── Anthropic Provider ───────────────────────────────────────────────────────

function toAnthropicMessages(messages: NormalizedMessage[]): unknown[] {
  return messages.map((msg) => {
    if (msg.role === 'user') {
      return {
        role: 'user',
        content: msg.content.map((part) => {
          if (part.type === 'text') return { type: 'text', text: part.text }
          if (part.type === 'tool_result') {
            return {
              type: 'tool_result',
              tool_use_id: part.toolCallId,
              content: part.content,
              is_error: part.isError ?? false,
            }
          }
          return part
        }),
      }
    } else {
      return {
        role: 'assistant',
        content: msg.content.map((part) => {
          if (part.type === 'text') return { type: 'text', text: part.text }
          if (part.type === 'tool_call') {
            return {
              type: 'tool_use',
              id: part.id,
              name: part.name,
              input: part.input,
            }
          }
          return part
        }),
      }
    }
  })
}

function toAnthropicTools(tools: ToolDefinition[]): unknown[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters,
  }))
}

export const anthropicProvider: ProviderAdapter = {
  name: 'anthropic',
  async *complete(options: CompletionOptions): AsyncGenerator<CompletionEvent> {
    const { settings, messages, tools, systemPrompt, signal } = options
    const { provider } = settings

    if (!provider.apiKey) {
      yield { type: 'error', error: 'Anthropic API key is not set. Please add your key in Settings.' }
      return
    }

    let response: Response
    try {
      response = await fetchWithRetry(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': provider.apiKey ?? '',
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-only-api': 'true',
          },
          body: JSON.stringify({
            model: provider.model,
            max_tokens: settings.maxTokens ?? 8192,
            system: systemPrompt,
            messages: toAnthropicMessages(messages),
            tools: toAnthropicTools(tools),
            stream: true,
          }),
          signal,
        },
        { maxAttempts: 5 }
      )
    } catch (err) {
      const classification = classifyError(null, err)
      yield {
        type: 'error',
        error: `Failed to reach Anthropic API: ${classification.message}`,
      }
      return
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      const classification = classifyError(response.status, new Error(errorText))
      yield { type: 'error', error: `Anthropic API error ${response.status}: ${errorText || classification.message}` }
      return
    }

    const toolInputBuffers: Record<string, string> = {}
    const toolNames: Record<string, string> = {}
    // Maps content block index → tool ID (fixes index mismatch when text/thinking blocks precede tool blocks)
    const toolIdByIndex: Record<number, string> = {}
    // Thinking block buffers: index → accumulated thinking text
    const thinkingBuffers: Record<number, string> = {}

    for await (const data of parseSSE(response, signal)) {
      let event: Record<string, unknown>
      try {
        event = JSON.parse(data)
      } catch {
        continue
      }

      const eventType = event.type as string

      if (eventType === 'content_block_start') {
        const block = event.content_block as Record<string, unknown>
        const blockIndex = event.index as number
        if (block.type === 'tool_use') {
          const id = block.id as string
          const name = block.name as string
          toolInputBuffers[id] = ''
          toolNames[id] = name
          toolIdByIndex[blockIndex] = id
          yield { type: 'tool_call_start', id, name }
        } else if (block.type === 'thinking') {
          thinkingBuffers[blockIndex] = ''
        }
      } else if (eventType === 'content_block_delta') {
        const delta = event.delta as Record<string, unknown>
        if (delta.type === 'text_delta') {
          yield { type: 'text_delta', text: delta.text as string }
        } else if (delta.type === 'thinking_delta') {
          const idx = event.index as number
          thinkingBuffers[idx] = (thinkingBuffers[idx] ?? '') + (delta.thinking as string)
          yield { type: 'thinking', text: delta.thinking as string }
        } else if (delta.type === 'input_json_delta') {
          const toolId = toolIdByIndex[event.index as number]
          if (toolId) {
            toolInputBuffers[toolId] += delta.partial_json as string
            yield { type: 'tool_call_input_delta', id: toolId, delta: delta.partial_json as string }
          }
        }
      } else if (eventType === 'content_block_stop') {
        const idx = event.index as number
        const toolId = toolIdByIndex[idx]
        if (toolId && toolNames[toolId]) {
          let input: Record<string, unknown> = {}
          try {
            input = JSON.parse(toolInputBuffers[toolId] || '{}')
          } catch {
            input = {}
          }
          yield { type: 'tool_call_complete', id: toolId, name: toolNames[toolId], input }
          delete toolInputBuffers[toolId]
          delete toolNames[toolId]
          delete toolIdByIndex[idx]
        }
      } else if (eventType === 'message_delta') {
        const delta = event.delta as Record<string, unknown>
        if (delta.stop_reason) {
          yield { type: 'message_complete', stopReason: delta.stop_reason as string }
        }
      } else if (eventType === 'error') {
        const err = event.error as Record<string, unknown>
        yield { type: 'error', error: (err.message as string) ?? 'Unknown Anthropic error' }
      }
    }
  },
}

// ─── Streaming <think> tag parser ─────────────────────────────────────────────
// Splits incoming text chunks into 'text' and 'thinking' segments in real-time.
// Handles partial tags split across chunks by buffering up to 12 trailing chars.

interface ThinkParseState {
  inThink: boolean
  buf: string // pending chars that might be a partial tag
}

function* parseThinkChunk(
  state: ThinkParseState,
  chunk: string,
): Generator<{ type: 'text' | 'thinking'; text: string }> {
  let remaining = state.buf + chunk
  state.buf = ''

  while (remaining.length > 0) {
    if (state.inThink) {
      const closeIdx = remaining.search(/<\/think(?:ing)?>/i)
      if (closeIdx !== -1) {
        const before = remaining.slice(0, closeIdx)
        if (before) yield { type: 'thinking', text: before }
        const closeTag = remaining.slice(closeIdx).match(/<\/think(?:ing)?>/i)!
        remaining = remaining.slice(closeIdx + closeTag[0].length)
        state.inThink = false
      } else {
        // Buffer trailing chars that might be a partial close tag
        const ltIdx = remaining.lastIndexOf('<')
        if (ltIdx !== -1 && ltIdx > remaining.length - 12) {
          if (ltIdx > 0) yield { type: 'thinking', text: remaining.slice(0, ltIdx) }
          state.buf = remaining.slice(ltIdx)
        } else {
          yield { type: 'thinking', text: remaining }
        }
        remaining = ''
      }
    } else {
      const openIdx = remaining.search(/<think(?:ing)?>/i)
      if (openIdx !== -1) {
        const before = remaining.slice(0, openIdx)
        if (before) yield { type: 'text', text: before }
        const openTag = remaining.slice(openIdx).match(/<think(?:ing)?>/i)!
        remaining = remaining.slice(openIdx + openTag[0].length)
        state.inThink = true
      } else {
        // Buffer trailing chars that might be a partial open tag
        const ltIdx = remaining.lastIndexOf('<')
        if (ltIdx !== -1 && ltIdx > remaining.length - 12) {
          if (ltIdx > 0) yield { type: 'text', text: remaining.slice(0, ltIdx) }
          state.buf = remaining.slice(ltIdx)
        } else {
          yield { type: 'text', text: remaining }
        }
        remaining = ''
      }
    }
  }
}

// ─── OpenAI Provider ──────────────────────────────────────────────────────────

// Strip base64 media data to avoid token blowups for text-only providers.
// Also strips the [Attached file: ...] markers added by the chat UI.
function stripBase64Images(content: string): string {
  let s = content
  // Remove full attachment blocks: \n\n[Attached file: name]\ndata:image/... or data:video/...
  s = s.replace(/\n\n\[Attached file: [^\]]+\]\ndata:(?:image|video)\/[^\s]+/g, '')
  // Remove bare data URLs (e.g. from tool results / screenshots)
  s = s.replace(/data:(?:image|video)\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '[media]')
  return s
}

// Extract [Attached file: name]\ndata:image/... and data:video/... blocks from user text.
// Returns cleaned text and typed media items.
function extractAttachments(text: string): {
  cleanText: string
  media: Array<{ kind: 'image' | 'video'; url: string }>
} {
  const media: Array<{ kind: 'image' | 'video'; url: string }> = []
  const cleanText = text
    .replace(/\n\n\[Attached file: [^\]]+\]\n(data:(?:image|video)\/[^\s]+)/g, (_, url) => {
      media.push({ kind: url.startsWith('data:video/') ? 'video' : 'image', url })
      return ''
    })
    .trim()
  return { cleanText, media }
}

function toOpenAIMessages(messages: NormalizedMessage[], systemPrompt: string, imageSupport = false): unknown[] {
  const result: unknown[] = [{ role: 'system', content: systemPrompt }]

  for (const msg of messages) {
    if (msg.role === 'user') {
      const textParts = msg.content.filter((p) => p.type === 'text')
      const toolResults = msg.content.filter((p) => p.type === 'tool_result')

      if (textParts.length > 0) {
        const combined = textParts.map((p) => (p.type === 'text' ? p.text : '')).join('\n')

        if (imageSupport) {
          const { cleanText, media } = extractAttachments(combined)
          if (media.length > 0) {
            const parts: unknown[] = []
            if (cleanText) parts.push({ type: 'text', text: cleanText })
            for (const m of media) {
              if (m.kind === 'video') {
                parts.push({ type: 'video_url', video_url: { url: m.url } })
              } else {
                parts.push({ type: 'image_url', image_url: { url: m.url } })
              }
            }
            result.push({ role: 'user', content: parts })
          } else {
            result.push({ role: 'user', content: combined })
          }
        } else {
          result.push({ role: 'user', content: stripBase64Images(combined) })
        }
      }

      for (const tr of toolResults) {
        if (tr.type === 'tool_result') {
          result.push({
            role: 'tool',
            tool_call_id: tr.toolCallId,
            content: stripBase64Images(tr.content),
          })
        }
      }
    } else {
      const textParts = msg.content.filter((p) => p.type === 'text')
      const toolCalls = msg.content.filter((p) => p.type === 'tool_call')

      const openAIMsg: Record<string, unknown> = { role: 'assistant' }
      if (textParts.length > 0) {
        openAIMsg.content = textParts.map((p) => (p.type === 'text' ? p.text : '')).join('\n')
      }
      if (toolCalls.length > 0) {
        openAIMsg.tool_calls = toolCalls.map((tc) => {
          if (tc.type === 'tool_call') {
            return {
              id: tc.id,
              type: 'function',
              function: { name: tc.name, arguments: JSON.stringify(tc.input) },
            }
          }
          return tc
        })
      }
      result.push(openAIMsg)
    }
  }

  return result
}

function toOpenAITools(tools: ToolDefinition[]): unknown[] {
  return tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }))
}

async function* openAICompatibleComplete(
  baseUrl: string,
  apiKey: string,
  options: CompletionOptions,
  extraBody?: { temperature?: number; top_p?: number; max_tokens?: number; chat_template_kwargs?: Record<string, unknown> },
  imageSupport = false,
): AsyncGenerator<CompletionEvent> {
  console.log('🌐 openAICompatibleComplete: Function started')

  console.log('🌐 openAICompatibleComplete: Destructuring options...')
  const { settings, messages, tools, systemPrompt, signal } = options
  console.log('✅ openAICompatibleComplete: Options destructured')

  console.log('🌐 openAICompatibleComplete: Getting providerName...')
  const providerName = settings.provider.provider
  console.log('✅ openAICompatibleComplete: providerName =', providerName)

  console.log('🌐 openAICompatibleComplete: Checking apiKey...')
  if (!apiKey && providerName !== 'ollama' && providerName !== 'harbor-free') {
    console.log('❌ openAICompatibleComplete: Missing API key')
    yield { type: 'error', error: `${providerName} API key is not set. Please add your key in Settings.` }
    return
  }
  console.log('✅ openAICompatibleComplete: API key check passed')

  console.log('🌐 openAICompatibleComplete: About to fetch from', baseUrl)
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(baseUrl.includes('openrouter')
        ? { 'HTTP-Referer': 'https://harbor-extension.app', 'X-Title': 'Harbor AI Agent' }
        : {}),
    },
    body: JSON.stringify({
      model: settings.provider.model,
      messages: toOpenAIMessages(messages, systemPrompt, imageSupport),
      tools: tools.length > 0 ? toOpenAITools(tools) : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      max_tokens: extraBody?.max_tokens ?? settings.maxTokens ?? 8192,
      stream: true,
      ...(extraBody?.temperature !== undefined ? { temperature: extraBody.temperature } : {}),
      ...(extraBody?.top_p !== undefined ? { top_p: extraBody.top_p } : {}),
      ...(extraBody?.chat_template_kwargs !== undefined ? { chat_template_kwargs: extraBody.chat_template_kwargs } : {}),
    }),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text()
    yield { type: 'error', error: `API error ${response.status}: ${errorText}` }
    return
  }

  const toolCallBuffers: Record<number, { id: string; name: string; args: string }> = {}
  const thinkState: ThinkParseState = { inThink: false, buf: '' }

  for await (const data of parseSSE(response, signal)) {
    let chunk: Record<string, unknown>
    try {
      chunk = JSON.parse(data)
    } catch {
      continue
    }

    const choices = chunk.choices as Array<Record<string, unknown>>
    if (!choices || choices.length === 0) continue

    const choice = choices[0]
    const delta = choice.delta as Record<string, unknown>
    if (!delta) continue

    // reasoning_content: used by DeepSeek R1, Poe reasoning models, and others
    if (delta.reasoning_content) {
      yield { type: 'thinking', text: delta.reasoning_content as string }
    }

    // Parse text content, extracting <think> tags in real-time
    if (delta.content) {
      for (const seg of parseThinkChunk(thinkState, delta.content as string)) {
        if (seg.type === 'thinking') {
          yield { type: 'thinking', text: seg.text }
        } else {
          yield { type: 'text_delta', text: seg.text }
        }
      }
    }

    if (delta.tool_calls) {
      const calls = delta.tool_calls as Array<Record<string, unknown>>
      for (const call of calls) {
        const idx = call.index as number
        if (!toolCallBuffers[idx]) {
          toolCallBuffers[idx] = { id: call.id as string ?? '', name: '', args: '' }
        }
        const buf = toolCallBuffers[idx]
        if (call.id) buf.id = call.id as string
        const fn = call.function as Record<string, unknown> | undefined
        if (fn) {
          if (fn.name) buf.name = fn.name as string
          if (fn.arguments) {
            buf.args += fn.arguments as string

            if (!buf._started) {
              buf._started = true
              yield { type: 'tool_call_start', id: buf.id, name: buf.name }
            }
            yield { type: 'tool_call_input_delta', id: buf.id, delta: fn.arguments as string }
          }
        }
      }
    }

    const finishReason = choice.finish_reason as string
    if (finishReason) {
      // Emit any complete tool calls
      for (const [, buf] of Object.entries(toolCallBuffers)) {
        let input: Record<string, unknown> = {}
        try {
          input = JSON.parse(buf.args || '{}')
        } catch {
          input = {}
        }
        yield { type: 'tool_call_complete', id: buf.id, name: buf.name, input }
      }
      yield { type: 'message_complete', stopReason: finishReason }
    }
  }
}

export const openaiProvider: ProviderAdapter = {
  name: 'openai',
  complete: (options) => openAICompatibleComplete('https://api.openai.com/v1', options.settings.provider.apiKey ?? '', options),
}

export const openrouterProvider: ProviderAdapter = {
  name: 'openrouter',
  complete: (options) => openAICompatibleComplete('https://openrouter.ai/api/v1', options.settings.provider.apiKey ?? '', options),
}

export const openaiCompatibleProvider: ProviderAdapter = {
  name: 'openai-compatible',
  complete: (options) => openAICompatibleComplete(
    options.settings.provider.baseUrl ?? 'http://localhost:11434/v1',
    options.settings.provider.apiKey ?? '',
    options
  ),
}

export const ollamaProvider: ProviderAdapter = {
  name: 'ollama',
  complete: (options) => openAICompatibleComplete(
    (options.settings.provider.baseUrl ?? 'http://localhost:11434') + '/v1',
    'ollama', // Ollama doesn't need a real key but the endpoint requires one
    options
  ),
}

// ─── Google Gemini Provider ───────────────────────────────────────────────────

function toGeminiMessages(messages: NormalizedMessage[]): unknown[] {
  const result: unknown[] = []

  for (const msg of messages) {
    const parts: unknown[] = []

    for (const part of msg.content) {
      if (part.type === 'text' && part.text) {
        parts.push({ text: part.text })
      } else if (part.type === 'tool_call') {
        parts.push({
          functionCall: {
            name: part.name,
            args: part.input,
          },
        })
      } else if (part.type === 'tool_result') {
        parts.push({
          functionResponse: {
            name: part.toolCallId, // Gemini uses name, not id
            response: { output: part.content },
          },
        })
      }
    }

    if (parts.length > 0) {
      result.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
      })
    }
  }

  return result
}

function toGeminiTools(tools: ToolDefinition[]): unknown[] {
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    },
  ]
}

export const googleProvider: ProviderAdapter = {
  name: 'google',
  async *complete(options: CompletionOptions): AsyncGenerator<CompletionEvent> {
    const { settings, messages, tools, systemPrompt, signal } = options
    const { provider } = settings

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:streamGenerateContent?key=${provider.apiKey}&alt=sse`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: toGeminiMessages(messages),
        tools: tools.length > 0 ? toGeminiTools(tools) : undefined,
        generationConfig: {
          maxOutputTokens: settings.maxTokens ?? 8192,
        },
      }),
      signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      yield { type: 'error', error: `Google API error ${response.status}: ${errorText}` }
      return
    }

    for await (const data of parseSSE(response, signal)) {
      let chunk: Record<string, unknown>
      try {
        chunk = JSON.parse(data)
      } catch {
        continue
      }

      const candidates = chunk.candidates as Array<Record<string, unknown>>
      if (!candidates || candidates.length === 0) continue

      const candidate = candidates[0]
      const content = candidate.content as Record<string, unknown>
      if (!content) continue

      const parts = content.parts as Array<Record<string, unknown>>
      for (const part of parts ?? []) {
        if (part.text) {
          yield { type: 'text_delta', text: part.text as string }
        }
        if (part.functionCall) {
          const fc = part.functionCall as Record<string, unknown>
          const id = `gemini-${fc.name}-${Date.now()}`
          yield { type: 'tool_call_start', id, name: fc.name as string }
          yield { type: 'tool_call_complete', id, name: fc.name as string, input: fc.args as Record<string, unknown> }
        }
      }

      const finishReason = candidate.finishReason as string
      if (finishReason && finishReason !== 'FINISH_REASON_UNSPECIFIED') {
        yield { type: 'message_complete', stopReason: finishReason }
      }
    }
  },
}

// ─── Harbor Free Provider ─────────────────────────────────────────────────────
// Uses NVIDIA NIM with two models:
// - MiniMax-m2.5: Fast, text-only model (default)
// - Qwen3.5-122B: Supports text, images (png/jpg/jpeg/webp, up to 5), and video (mp4/mov/webm, 1)
// Automatically switches to Qwen if message contains image/video attachments.

const HARBOR_FREE_KEY = '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'
const HARBOR_FREE_NVIDIA_URL = 'https://integrate.api.nvidia.com/v1'
const HARBOR_FREE_TEXT_MODEL = 'minimaxai/minimax-m2.5'
const HARBOR_FREE_IMAGE_MODEL = 'qwen/qwen3.5-122b-a10b'

function hasAttachments(messages: NormalizedMessage[]): boolean {
  for (const msg of messages) {
    if (msg.role === 'user') {
      const textParts = msg.content.filter((p) => p.type === 'text')
      for (const part of textParts) {
        if (part.type === 'text' && /\[Attached file:.*\]\n(data:(image|video)\/[^\s]+)/.test(part.text)) {
          return true
        }
      }
    }
  }
  return false
}

async function* harborFreeComplete(options: CompletionOptions): AsyncGenerator<CompletionEvent> {
  const hasImages = hasAttachments(options.messages)
  // Harbor Free ALWAYS uses the shared API key, never user-provided keys
  const apiKey = HARBOR_FREE_KEY

  // If images detected, use Qwen (image-capable model)
  if (hasImages) {
    yield* openAICompatibleComplete(
      HARBOR_FREE_NVIDIA_URL, apiKey,
      { ...options, settings: { ...options.settings, provider: { ...options.settings.provider, model: HARBOR_FREE_IMAGE_MODEL } } },
      { temperature: 0.45, top_p: 0.95, max_tokens: Math.min(options.settings.maxTokens ?? 32768, 32768) },
      true,
    )
    return
  }

  // Try MiniMax-m2.5 with 1.5s first-token timeout
  const minimaxAbort = new AbortController()
  const minimaxOptions = {
    ...options,
    signal: minimaxAbort.signal,
    settings: { ...options.settings, provider: { ...options.settings.provider, model: HARBOR_FREE_TEXT_MODEL } },
  }

  let gotFirstToken = false
  const fallbackTimer = setTimeout(() => {
    if (!gotFirstToken) minimaxAbort.abort()
  }, 1500)

  const buffered: CompletionEvent[] = []
  let shouldFallback = false

  try {
    for await (const event of openAICompatibleComplete(
      HARBOR_FREE_NVIDIA_URL, apiKey, minimaxOptions,
      { temperature: 0.45, top_p: 0.95, max_tokens: Math.min(options.settings.maxTokens ?? 32768, 32768) },
      false,
    )) {
      if (event.type === 'text_delta' || event.type === 'thinking') gotFirstToken = true
      clearTimeout(fallbackTimer)
      yield event
      if (event.type === 'message_complete') return
    }
    clearTimeout(fallbackTimer)
    return
  } catch (err) {
    clearTimeout(fallbackTimer)
    if (!gotFirstToken) {
      shouldFallback = true
    } else {
      yield { type: 'error', error: err instanceof Error ? err.message : String(err) }
      return
    }
  }

  // Fallback to Qwen
  if (shouldFallback) {
    yield* openAICompatibleComplete(
      HARBOR_FREE_NVIDIA_URL, apiKey,
      { ...options, settings: { ...options.settings, provider: { ...options.settings.provider, model: HARBOR_FREE_IMAGE_MODEL } } },
      { temperature: 0.45, top_p: 0.95, max_tokens: Math.min(options.settings.maxTokens ?? 32768, 32768) },
      true,
    )
  }
}

export const harborFreeProvider: ProviderAdapter = {
  name: 'harbor-free',
  complete: harborFreeComplete,
}

// ─── Poe Provider ─────────────────────────────────────────────────────────────
// Poe exposes an OpenAI-compatible API at api.poe.com/v1.
// Model name = the Poe bot handle (e.g. "Claude-3-7-Sonnet", "GPT-4o").
// Thinking is embedded in the response text as *Thinking...*\n> ... (extracted by frontend).

export const poeProvider: ProviderAdapter = {
  name: 'poe',
  complete: (options) =>
    openAICompatibleComplete('https://api.poe.com/v1', options.settings.provider.apiKey ?? '', options),
}

// ─── Provider Registry ────────────────────────────────────────────────────────

const providers: Record<string, ProviderAdapter> = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
  google: googleProvider,
  ollama: ollamaProvider,
  openrouter: openrouterProvider,
  'openai-compatible': openaiCompatibleProvider,
  poe: poeProvider,
  'harbor-free': harborFreeProvider,
}

export function getProvider(name: string): ProviderAdapter {
  const provider = providers[name]
  if (!provider) throw new Error(`Unknown provider: ${name}`)
  return provider
}
