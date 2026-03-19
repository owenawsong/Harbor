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
import { normalizeStopReason, isToolUseReason, isFinishedReason, getStopReasonDescription } from './stop-reason'
import { detectToolLoop, getSuggestionForLoop } from './tool-loop-detection'

function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

/**
 * Tools that modify page state and should execute sequentially
 */
const SEQUENTIAL_TOOLS = new Set([
  'click',
  'fill_input',
  'clear_input',
  'press_key',
  'select_option',
  'check_input',
  'navigate',
  'go_back',
  'go_forward',
  'reload_page',
])

/**
 * Detect if tool calls have dependencies that require sequential execution
 * Tools like clicking, filling, and navigation should run one-at-a-time
 * because the page state changes between operations
 */
function detectSequentialDependencies(toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }>): boolean {
  if (toolCalls.length <= 1) return false

  // If any tool modifies page state, execute sequentially
  return toolCalls.some((tc) => SEQUENTIAL_TOOLS.has(tc.name))
}

/**
 * Execute a single tool and return its result
 */
async function executeSingleTool(
  tc: { id: string; name: string; input: Record<string, unknown> },
  getToolByName: (name: string) => import('../agent/types').ToolHandler | undefined,
  browserContext: import('./types').BrowserContext,
  onEvent: (event: AgentEvent) => void,
  messageId: string
): Promise<ToolResultPart> {
  const handler = getToolByName(tc.name)
  if (!handler) {
    const result = { success: false, error: `Unknown tool: ${tc.name}` }
    onEvent({
      type: 'tool_call_result',
      toolCallId: tc.id,
      toolName: tc.name,
      result,
    })
    return {
      type: 'tool_result',
      toolCallId: tc.id,
      content: JSON.stringify(result),
      isError: true,
    }
  }

  let toolResult: import('../../shared/types').ToolResult
  try {
    // Add small delay before navigation tools to ensure page is ready
    if (SEQUENTIAL_TOOLS.has(tc.name)) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    toolResult = await Promise.race([
      handler.execute(tc.input, browserContext),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Tool "${tc.name}" timed out after 30s`)), 30_000)
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

  return {
    type: 'tool_result',
    toolCallId: tc.id,
    content: toolResult.success ? JSON.stringify(toolResult.output) : `Error: ${toolResult.error}`,
    isError: !toolResult.success,
  }
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
  try {
    console.log('🤖 runAgent: Starting agent loop')
    const { sessionId, message, settings, history, onEvent, signal, attachedTabId } = options
    console.log('🤖 runAgent: Extracted options:', { sessionId, messageLength: message.length, providerName: settings.provider.provider, historyLength: history.length })

    console.log('🤖 runAgent: Getting provider:', settings.provider.provider)
    const provider = getProvider(settings.provider.provider)
    console.log('✅ runAgent: Provider retrieved:', { providerName: provider.name })

    console.log('🤖 runAgent: Building system prompt')
    const systemPrompt = buildSystemPrompt({
      enableMemory: settings.enableMemory,
    })
    console.log('✅ runAgent: System prompt built')

    console.log('🤖 runAgent: Getting tool definitions')
    const tools = getToolDefinitions()
    console.log('✅ runAgent: Tools loaded:', { toolCount: tools.length })

    console.log('🤖 runAgent: Building browser context...')
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

    console.log('✅ runAgent: Browser context created')

    console.log('🤖 runAgent: Normalizing message history...')
    // Normalize existing history
    const normalizedHistory = chatMessagesToNormalized(history)
    console.log('✅ runAgent: History normalized:', { normalizedCount: normalizedHistory.length })

    console.log('🤖 runAgent: Creating user message object...')
    // Add the new user message
    const userMessage: NormalizedMessage = {
      role: 'user',
      content: [{ type: 'text', text: message }],
    }
    console.log('✅ runAgent: User message created')

    console.log('🤖 runAgent: Pushing user message to history...')
    normalizedHistory.push(userMessage)
    console.log('✅ runAgent: User message pushed')

    console.log('🤖 runAgent: Initializing loop variables...')
    let iterations = 0
    console.log('✅ runAgent: iterations initialized')

    const messageId = generateId()
    console.log('✅ runAgent: messageId generated:', { messageId })

    const recentToolCalls: Array<{ name: string; input: Record<string, unknown>; timestamp: number }> = []
    console.log('✅ runAgent: recentToolCalls array created')

    console.log('🤖 runAgent: Starting main while loop...')
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
              onEvent({ type: 'thinking', text: event.text, messageId })
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

      // Execute any tool calls that were made
      if (completedToolCalls.length > 0) {
        const toolResults: Array<ToolResultPart> = []

        // Track tool calls for loop detection
        for (const tc of completedToolCalls) {
          recentToolCalls.push({ name: tc.name, input: tc.input, timestamp: Date.now() })
          // Keep only last 10 tool calls in memory
          if (recentToolCalls.length > 10) recentToolCalls.shift()
      }

      // Detect tool loop
      const loopDetection = detectToolLoop(recentToolCalls, 3)
      if (loopDetection.isLooped) {
        console.warn(`⚠️ Tool loop detected: ${loopDetection.suggestion}`)
        onEvent({
          type: 'error',
          error: `Tool loop detected: Agent is calling "${loopDetection.repeatedToolName}" repeatedly (${loopDetection.consecutiveCount} times). ${loopDetection.suggestion}`,
        })
        return
      }

      // Detect dependencies and execute sequentially when needed
      const shouldSequenceExecution = detectSequentialDependencies(completedToolCalls)

      if (shouldSequenceExecution) {
        // Execute tools one at a time for operations that depend on page state changes
        for (const tc of completedToolCalls) {
          const result = await executeSingleTool(tc, getToolByName, browserContext, onEvent, messageId)
          toolResults.push(result)
        }
      } else {
        // Execute tools in parallel when independent
        const results = await Promise.all(
          completedToolCalls.map((tc) => executeSingleTool(tc, getToolByName, browserContext, onEvent, messageId))
        )
        toolResults.push(...results)
      }

      // Add tool results to history so agent can see them in next iteration
      if (toolResults.length > 0) {
        normalizedHistory.push({ role: 'user', content: toolResults })
      }

      // Continue loop to send results back to agent (don't check stop reason if tools were called)
      continue
    }

    // No tool calls were made - check stop reason to determine if task is complete
    const settings = await Promise.resolve(options.settings)
    const providerName = settings.provider.provider
    const normalizedReason = normalizeStopReason(providerName, stopReason)

    if (isFinishedReason(normalizedReason)) {
      // Model finished naturally without requesting more tools
      console.log(`✅ Agent finished: ${getStopReasonDescription(normalizedReason)}`)
      break
    }

    if (isToolUseReason(normalizedReason)) {
      // Model expects tool results but none were made - shouldn't happen
      console.log(`⚠️ Unexpected state: ${getStopReasonDescription(normalizedReason)} but no tools were called`)
      break
    }

    // Unknown reason - log and continue loop in case model has more to say
    console.log(`ℹ️ ${getStopReasonDescription(normalizedReason)}`)
    if (iterations < MAX_TOOL_ITERATIONS - 1) {
      // Continue looping to let model finish naturally
      continue
    } else {
      break
    }
  }

    if (iterations >= MAX_TOOL_ITERATIONS) {
      console.log('⚠️  runAgent: Max iterations reached')
      onEvent({
        type: 'error',
        error: `Agent reached maximum iterations (${MAX_TOOL_ITERATIONS}). Task may be incomplete.`,
      })
    }

    console.log('✅ runAgent: Agent loop complete')
    onEvent({ type: 'agent_complete' })
  } catch (err) {
    console.error('💥 runAgent FATAL ERROR:', err instanceof Error ? err.message : String(err), err)
    onEvent({ type: 'error', error: `Agent error: ${err instanceof Error ? err.message : String(err)}` })
  }
}
