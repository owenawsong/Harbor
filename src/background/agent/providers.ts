/**
 * AI Provider Adapters
 * Each provider implements the ProviderAdapter interface with streaming support.
 * Uses direct fetch calls for Chrome extension compatibility.
 */

import type { ProviderAdapter, CompletionOptions, CompletionEvent, NormalizedMessage } from './types'
import type { ToolDefinition } from '../../shared/types'

// ─── SSE Parser ───────────────────────────────────────────────────────────────

async function* parseSSE(response: Response): AsyncGenerator<string> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
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
    })

    if (!response.ok) {
      const errorText = await response.text()
      yield { type: 'error', error: `Anthropic API error ${response.status}: ${errorText}` }
      return
    }

    const toolInputBuffers: Record<string, string> = {}
    const toolNames: Record<string, string> = {}
    // Maps content block index → tool ID (fixes index mismatch when text/thinking blocks precede tool blocks)
    const toolIdByIndex: Record<number, string> = {}

    for await (const data of parseSSE(response)) {
      let event: Record<string, unknown>
      try {
        event = JSON.parse(data)
      } catch {
        continue
      }

      const eventType = event.type as string

      if (eventType === 'content_block_start') {
        const block = event.content_block as Record<string, unknown>
        if (block.type === 'tool_use') {
          const id = block.id as string
          const name = block.name as string
          const blockIndex = event.index as number
          toolInputBuffers[id] = ''
          toolNames[id] = name
          toolIdByIndex[blockIndex] = id
          yield { type: 'tool_call_start', id, name }
        }
      } else if (eventType === 'content_block_delta') {
        const delta = event.delta as Record<string, unknown>
        if (delta.type === 'text_delta') {
          yield { type: 'text_delta', text: delta.text as string }
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

// ─── OpenAI Provider ──────────────────────────────────────────────────────────

function toOpenAIMessages(messages: NormalizedMessage[], systemPrompt: string): unknown[] {
  const result: unknown[] = [{ role: 'system', content: systemPrompt }]

  for (const msg of messages) {
    if (msg.role === 'user') {
      const textParts = msg.content.filter((p) => p.type === 'text')
      const toolResults = msg.content.filter((p) => p.type === 'tool_result')

      if (textParts.length > 0) {
        result.push({
          role: 'user',
          content: textParts.map((p) => (p.type === 'text' ? p.text : '')).join('\n'),
        })
      }

      for (const tr of toolResults) {
        if (tr.type === 'tool_result') {
          result.push({
            role: 'tool',
            tool_call_id: tr.toolCallId,
            content: tr.content,
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
  options: CompletionOptions
): AsyncGenerator<CompletionEvent> {
  const { settings, messages, tools, systemPrompt, signal } = options
  const providerName = settings.provider.provider

  if (!apiKey && providerName !== 'ollama') {
    yield { type: 'error', error: `${providerName} API key is not set. Please add your key in Settings.` }
    return
  }

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
      messages: toOpenAIMessages(messages, systemPrompt),
      tools: tools.length > 0 ? toOpenAITools(tools) : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      max_tokens: settings.maxTokens ?? 8192,
      stream: true,
    }),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text()
    yield { type: 'error', error: `API error ${response.status}: ${errorText}` }
    return
  }

  const toolCallBuffers: Record<number, { id: string; name: string; args: string }> = {}

  for await (const data of parseSSE(response)) {
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

    if (delta.content) {
      yield { type: 'text_delta', text: delta.content as string }
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

    for await (const data of parseSSE(response)) {
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

// ─── Provider Registry ────────────────────────────────────────────────────────

const providers: Record<string, ProviderAdapter> = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
  google: googleProvider,
  ollama: ollamaProvider,
  openrouter: openrouterProvider,
  'openai-compatible': openaiCompatibleProvider,
}

export function getProvider(name: string): ProviderAdapter {
  const provider = providers[name]
  if (!provider) throw new Error(`Unknown provider: ${name}`)
  return provider
}
