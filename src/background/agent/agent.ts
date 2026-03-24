/**
 * Harbor Agent Loop
 * Orchestrates the AI agent: sends messages, executes tool calls, and streams results.
 */

import type { AgentRunOptions, NormalizedMessage, ToolCallPart, TextPart, ToolResultPart, BrowserContext } from './types'
import type { AgentEvent, ChatMessage, AgentSettings } from '../../shared/types'
import { getProvider } from './providers'
import { buildSystemPrompt } from './prompt'
import { getToolByName, getToolDefinitions } from '../tools/index'
import { MAX_TOOL_ITERATIONS } from '../../shared/constants'
import { RateLimitManager, sleep, isRateLimitError } from './rateLimitManager'

function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

async function executeSubAgents(
  input: Record<string, unknown>,
  settings: AgentSettings,
  parentSessionId: string,
  parentOnEvent: (event: import('../../shared/types').AgentEvent) => void,
): Promise<import('../../shared/types').ToolResult> {
  const tasks = input.tasks as Array<{ taskId: string; description: string }> | undefined
  const briefing = input.briefing as string | undefined

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    // Provide detailed error message for debugging
    const inputKeys = Object.keys(input).join(', ')
    const debugInfo = `Received: { ${inputKeys} }. Expected: { tasks: [...], briefing?: string }`
    return {
      success: false,
      error: `Invalid input: tasks must be a non-empty array. ${debugInfo}`,
    }
  }

  if (tasks.length > 10) {
    return {
      success: false,
      error: 'Too many sub-agents: maximum 10 sub-agents allowed',
    }
  }

  try {
    // Run all sub-agents in parallel
    const subAgentPromises = tasks.map((task) =>
      runSubAgent(task, briefing, settings, parentSessionId, parentOnEvent)
    )

    const results = await Promise.all(subAgentPromises)

    // Check if any failed
    const failures = results.filter((r) => r.status === 'error')

    return {
      success: failures.length === 0,
      output: {
        results,
        successCount: results.filter((r) => r.status === 'success').length,
        failureCount: failures.length,
        summary: `Completed ${results.length} sub-tasks: ${results.filter((r) => r.status === 'success').length} successful, ${failures.length} failed`,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function runSubAgent(
  task: { taskId: string; description: string },
  briefing: string | undefined,
  settings: AgentSettings,
  parentSessionId: string,
  parentOnEvent: (event: import('../../shared/types').AgentEvent) => void,
): Promise<{ taskId: string; status: 'success' | 'error'; result?: string; error?: string }> {
  return new Promise((resolve) => {
    const subSessionId = `${parentSessionId}_sub_${task.taskId}`
    let finalResult = ''
    let hasError = false
    let errorMessage = ''

    // Create an event handler that collects results silently
    const onEvent = (event: import('../../shared/types').AgentEvent) => {
      if (event.type === 'text_delta') {
        const textDelta = event as any
        finalResult += textDelta.text
      } else if (event.type === 'error') {
        const errorEvent = event as any
        hasError = true
        errorMessage = errorEvent.error
      }
    }

    // Build the sub-agent message with context
    const subAgentMessage = `${briefing ? `Context: ${briefing}\n\n` : ''}Your task: ${task.description}`

    // Run the sub-agent
    runAgent({
      sessionId: subSessionId,
      message: subAgentMessage,
      settings,
      history: [],
      onEvent,
      signal: undefined,
      attachedTabId: undefined,
      enablePlanning: false,
      chatModeOnly: false,
    }).then(() => {
      // Resolve when agent completes
      resolve({
        taskId: task.taskId,
        status: hasError ? 'error' : 'success',
        result: hasError ? undefined : finalResult,
        error: hasError ? errorMessage : undefined,
      })
    }).catch((err) => {
      resolve({
        taskId: task.taskId,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      })
    })
  })
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
  const { sessionId, message, settings, history, onEvent, signal, attachedTabId, enablePlanning, chatModeOnly } = options
  const provider = getProvider(settings.provider.provider)

  // Load user profile from storage if enabled
  let memoryData = ''
  if (settings.enableMemory) {
    try {
      const storageData = await new Promise<Record<string, any>>((resolve) => {
        chrome.storage.local.get('harbor_user_profile', (data) => {
          resolve(data)
        })
      })
      const profile = storageData.harbor_user_profile
      if (profile) {
        // Format user profile for system prompt
        const profileLines: string[] = []

        if (profile.name) profileLines.push(`**User Name**: ${profile.name}`)
        if (profile.role) profileLines.push(`**Role/Title**: ${profile.role}`)
        if (profile.timezone) profileLines.push(`**Timezone**: ${profile.timezone}`)
        if (profile.workingHours) profileLines.push(`**Working Hours**: ${profile.workingHours}`)

        if (profile.communicationStyle) {
          profileLines.push(`**Communication Style**: The user prefers ${profile.communicationStyle} communication.`)
        }
        if (profile.responseDetailLevel) {
          profileLines.push(`**Response Detail**: The user prefers ${profile.responseDetailLevel} responses.`)
        }

        if (profile.expertise && profile.expertise.length > 0) {
          profileLines.push(`**Expertise**: ${profile.expertise.join(', ')}`)
        }
        if (profile.learningInterests && profile.learningInterests.length > 0) {
          profileLines.push(`**Learning Interests**: ${profile.learningInterests.join(', ')}`)
        }
        if (profile.activeProjects && profile.activeProjects.length > 0) {
          profileLines.push(`**Current Projects**: ${profile.activeProjects.join(', ')}`)
        }

        if (profile.notes && profile.notes.length > 0) {
          profileLines.push(`**Important Notes**:\n${profile.notes.map((n: string) => `- ${n}`).join('\n')}`)
        }

        if (profileLines.length > 0) {
          memoryData = profileLines.join('\n')
        }
      }
    } catch (err) {
      console.error('Error loading user profile:', err)
    }
  }

  const systemPrompt = buildSystemPrompt({
    enableMemory: settings.enableMemory && memoryData.length > 0,
    memory: memoryData,
    enablePlanning,
    chatMode: options.chatModeOnly,
  })
  // In chat mode, don't provide any tools - pure conversation only
  const tools = options.chatModeOnly ? [] : getToolDefinitions()

  // Initialize rate limit manager with settings config
  const rateLimitManager = new RateLimitManager(settings.rateLimitConfig)

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

    // Check if we're rate limited and need to wait
    if (rateLimitManager.getState().isLimited && !rateLimitManager.shouldRetry()) {
      onEvent({
        type: 'error',
        error: `Rate limit exceeded. Max retries exhausted. Last error: ${rateLimitManager.getState().lastError}`,
      })
      return
    }

    if (rateLimitManager.getState().isLimited) {
      const waitTimeMs = rateLimitManager.getWaitTimeMs()
      if (waitTimeMs > 0) {
        onEvent({
          type: 'rate_limited',
          waitTimeMs,
          attemptCount: rateLimitManager.getState().attemptCount,
          messageId,
        })
        await sleep(waitTimeMs)
      }
    }

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
            // Mark rate limit as resolved on successful completion
            rateLimitManager.markSuccess()
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

      // Check if this is a rate limit error
      if (isRateLimitError(err)) {
        rateLimitManager.markLimited(err)
        // Continue to retry in next iteration
        continue
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
      const executionMode = settings.toolExecutionMode ?? 'parallel'


      if (executionMode === 'sequential') {
        // Sequential: Execute tools one at a time (safer for interdependent tools)
        for (const tc of completedToolCalls) {
          // Special handling for sub-agents tool
          if (tc.name === 'create_parallel_sub_agents') {
            const subAgentResult = await executeSubAgents(tc.input, settings, sessionId, onEvent)
            onEvent({
              type: 'tool_call_result',
              toolCallId: tc.id,
              toolName: tc.name,
              result: subAgentResult,
            })
            toolResults.push({
              type: 'tool_result',
              toolCallId: tc.id,
              content: JSON.stringify(subAgentResult),
              isError: !subAgentResult.success,
            })
            continue
          }

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
            // Use per-tool timeout if defined (priority: settings > definition > default)
            const toolDef = tools.find((t) => t.name === tc.name)
            const timeoutMs = settings.toolTimeouts?.[tc.name] ?? toolDef?.timeoutMs ?? 30_000

            toolResult = await Promise.race([
              handler.execute(tc.input, browserContext),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`Tool "${tc.name}" timed out after ${timeoutMs}ms`)), timeoutMs),
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
      } else {
        // Parallel: Execute all tools concurrently (faster, but less safe for interdependencies)
        const parallelResults = await Promise.all(
          completedToolCalls.map(async (tc) => {
            // Special handling for sub-agents tool
            if (tc.name === 'create_parallel_sub_agents') {
              const subAgentResult = await executeSubAgents(tc.input, settings, sessionId, onEvent)
              return { toolCall: tc, result: subAgentResult }
            }

            const handler = getToolByName(tc.name)
            if (!handler) {
              return {
                toolCall: tc,
                result: { success: false, error: `Unknown tool: ${tc.name}` } as import('../../shared/types').ToolResult,
              }
            }

            let toolResult: import('../../shared/types').ToolResult
            try {
              // Use per-tool timeout if defined (priority: settings > definition > default)
              const toolDef = tools.find((t) => t.name === tc.name)
              const timeoutMs = settings.toolTimeouts?.[tc.name] ?? toolDef?.timeoutMs ?? 30_000

              toolResult = await Promise.race([
                handler.execute(tc.input, browserContext),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error(`Tool "${tc.name}" timed out after ${timeoutMs}ms`)), timeoutMs),
                ),
              ])
            } catch (err) {
              toolResult = { success: false, error: err instanceof Error ? err.message : String(err) }
            }

            return { toolCall: tc, result: toolResult }
          })
        )

        // Process results and emit events in order
        for (const { toolCall: tc, result: toolResult } of parallelResults) {
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
      }

      // Add tool results to history so agent can see them in next iteration
      if (toolResults.length > 0) {
        normalizedHistory.push({ role: 'user', content: toolResults })
      }

      // Continue loop to send results back to agent (don't check stop reason if tools were called)
      continue
    }

    // No tool calls were made - check stop reason to determine if task is complete
    // Support various formats: 'tool_use', 'tool_calls', 'TOOL_USE', 'function_calls', etc.
    const isToolUseReason = stopReason && /tool|function/i.test(stopReason)
    if (stopReason && !isToolUseReason) {
      // Model finished naturally without requesting more tools
      break
    }

    // If no tools were called AND stop reason is unknown/empty, assume we're done
    if (!stopReason) {
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
