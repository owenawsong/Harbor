/**
 * Harbor Agent Loop
 * Orchestrates the AI agent: sends messages, executes tool calls, and streams results.
 */

import type { AgentRunOptions, NormalizedMessage, ToolCallPart, TextPart, ToolResultPart, BrowserContext } from './types'
import type { AgentEvent, ChatMessage } from '../../shared/types'
import { getProvider } from './providers'
import { buildSystemPrompt } from './prompt'
import { getToolByName, getToolDefinitions } from '../tools/index'
import { MAX_TOOL_ITERATIONS } from '../../shared/constants'

function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

function chatMessagesToNormalized(messages: ChatMessage[]): NormalizedMessage[] {
  const result: NormalizedMessage[] = []

  for (const msg of messages) {
    if (msg.role === 'user') {
      const parts: Array<TextPart | ToolResultPart> = []
      for (const c of msg.content) {
        if (c.type === 'text') parts.push({ type: 'text', text: c.text })
        else if (c.type === 'tool_result') {
          parts.push({
            type: 'tool_result',
            toolCallId: c.toolCallId,
            content: typeof c.result === 'string' ? c.result : JSON.stringify(c.result),
            isError: c.isError,
          })
        }
      }
      if (parts.length > 0) result.push({ role: 'user', content: parts })
    } else if (msg.role === 'assistant') {
      const parts: Array<TextPart | ToolCallPart> = []
      for (const c of msg.content) {
        if (c.type === 'text') parts.push({ type: 'text', text: c.text })
        else if (c.type === 'tool_call') {
          parts.push({
            type: 'tool_call',
            id: c.id,
            name: c.name,
            input: c.input,
          })
        }
      }
      if (parts.length > 0) result.push({ role: 'assistant', content: parts })
    }
  }

  return result
}

export async function runAgent(options: AgentRunOptions): Promise<void> {
  const { sessionId, message, settings, history, onEvent, signal, attachedTabId } = options
  const provider = getProvider(settings.provider.provider)
  const systemPrompt = buildSystemPrompt({
    enableMemory: settings.enableMemory,
  })
  const tools = getToolDefinitions()

  // Build browser context
  const browserContext: BrowserContext = {
    async sendToTab(tabId, msg) {
      return chrome.tabs.sendMessage(tabId, msg)
    },
    async getActiveTab() {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
      return tab
    },
    async captureScreenshot(tabId?: number) {
      let targetTabId = tabId
      if (!targetTabId) {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
        targetTabId = tab?.id
      }
      if (!targetTabId) throw new Error('No tab to screenshot')

      const dataUrl = await chrome.tabs.captureVisibleTab(
        await chrome.tabs.get(targetTabId).then((t) => t.windowId),
        { format: 'jpeg', quality: 85 }
      )
      return dataUrl
    },
  }

  // Normalize existing history
  const normalizedHistory = chatMessagesToNormalized(history)

  // Add the new user message
  const userMessage: NormalizedMessage = {
    role: 'user',
    content: [{ type: 'text', text: message }],
  }
  normalizedHistory.push(userMessage)

  let iterations = 0
  const messageId = generateId()

  while (iterations < MAX_TOOL_ITERATIONS) {
    if (signal?.aborted) {
      onEvent({ type: 'error', error: 'Agent stopped by user.' })
      return
    }

    iterations++

    // Accumulate the response
    let currentText = ''
    const pendingToolCalls: Map<string, { name: string; input: string }> = new Map()
    const completedToolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = []
    let stopReason = ''

    try {
      for await (const event of provider.complete({
        settings,
        messages: normalizedHistory,
        tools,
        systemPrompt,
        signal,
      })) {
        if (signal?.aborted) break

        switch (event.type) {
          case 'text_delta':
            currentText += event.text
            onEvent({ type: 'text_delta', text: event.text, messageId })
            break

          case 'thinking':
            onEvent({ type: 'thinking', text: event.text })
            break

          case 'tool_call_start':
            pendingToolCalls.set(event.id, { name: event.name, input: '' })
            onEvent({
              type: 'tool_call_start',
              messageId,
              toolCallId: event.id,
              toolName: event.name,
            })
            break

          case 'tool_call_input_delta':
            if (pendingToolCalls.has(event.id)) {
              pendingToolCalls.get(event.id)!.input += event.delta
              onEvent({
                type: 'tool_call_input',
                toolCallId: event.id,
                partialInput: event.delta,
              })
            }
            break

          case 'tool_call_complete':
            completedToolCalls.push({
              id: event.id,
              name: event.name,
              input: event.input,
            })
            pendingToolCalls.delete(event.id)
            break

          case 'message_complete':
            stopReason = event.stopReason
            // Emit message_complete so the frontend stops the streaming cursor on this message.
            // NOTE: isRunning stays true — agent_complete is emitted at the end of the full loop.
            onEvent({ type: 'message_complete', messageId, stopReason: event.stopReason })
            break

          case 'error':
            onEvent({ type: 'error', error: event.error })
            return
        }
      }
    } catch (err) {
      if (signal?.aborted) {
        onEvent({ type: 'error', error: 'Agent stopped by user.' })
        return
      }
      onEvent({ type: 'error', error: err instanceof Error ? err.message : String(err) })
      return
    }

    // Add assistant message to history
    const assistantParts: Array<TextPart | ToolCallPart> = []
    if (currentText) assistantParts.push({ type: 'text', text: currentText })
    for (const tc of completedToolCalls) {
      assistantParts.push({ type: 'tool_call', id: tc.id, name: tc.name, input: tc.input })
    }
    if (assistantParts.length > 0) {
      normalizedHistory.push({ role: 'assistant', content: assistantParts })
    }

    // If no tool calls, we're done
    if (completedToolCalls.length === 0) break

    // Execute tool calls
    const toolResults: Array<ToolResultPart> = []

    for (const tc of completedToolCalls) {
      const handler = getToolByName(tc.name)
      if (!handler) {
        const result = { success: false, error: `Unknown tool: ${tc.name}` }
        onEvent({
          type: 'tool_call_result',
          toolCallId: tc.id,
          toolName: tc.name,
          result,
        })
        toolResults.push({
          type: 'tool_result',
          toolCallId: tc.id,
          content: JSON.stringify(result),
          isError: true,
        })
        continue
      }

      let toolResult: import('../../shared/types').ToolResult
      try {
        toolResult = await Promise.race([
          handler.execute(tc.input, browserContext),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Tool "${tc.name}" timed out after 30s`)), 30_000),
          ),
        ])
      } catch (err) {
        toolResult = { success: false, error: err instanceof Error ? err.message : String(err) }
      }

      onEvent({
        type: 'tool_call_result',
        toolCallId: tc.id,
        toolName: tc.name,
        result: toolResult,
      })

      toolResults.push({
        type: 'tool_result',
        toolCallId: tc.id,
        content: toolResult.success
          ? JSON.stringify(toolResult.output)
          : `Error: ${toolResult.error}`,
        isError: !toolResult.success,
      })
    }

    // Add tool results to history
    if (toolResults.length > 0) {
      normalizedHistory.push({ role: 'user', content: toolResults })
    }

    // Check stop reason - if it wasn't tool_use/tool_calls, break
    // Support various formats: 'tool_use', 'tool_calls', 'TOOL_USE', 'function_calls', etc.
    const isToolUseReason = stopReason && /tool|function/i.test(stopReason)
    if (stopReason && !isToolUseReason) {
      break
    }
  }

  if (iterations >= MAX_TOOL_ITERATIONS) {
    onEvent({
      type: 'error',
      error: `Agent reached maximum iterations (${MAX_TOOL_ITERATIONS}). Task may be incomplete.`,
    })
  }

  onEvent({ type: 'agent_complete' })
}
