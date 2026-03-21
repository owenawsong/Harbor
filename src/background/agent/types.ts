import type { ToolDefinition, ToolResult, AgentSettings, ChatMessage } from '../../shared/types'

export interface ToolHandler {
  definition: ToolDefinition
  execute: (input: Record<string, unknown>, context: BrowserContext) => Promise<ToolResult>
}

export interface BrowserContext {
  sendToTab: (tabId: number, message: unknown) => Promise<unknown>
  getActiveTab: () => Promise<chrome.tabs.Tab>
  captureScreenshot: (tabId?: number) => Promise<string> // base64 data URL
}

export interface ProviderAdapter {
  name: string
  complete: (options: CompletionOptions) => AsyncGenerator<CompletionEvent>
}

export interface CompletionOptions {
  settings: AgentSettings
  messages: NormalizedMessage[]
  tools: ToolDefinition[]
  systemPrompt: string
  signal?: AbortSignal
}

export type NormalizedMessage =
  | { role: 'user'; content: Array<TextPart | ToolResultPart> }
  | { role: 'assistant'; content: Array<TextPart | ToolCallPart> }

export interface TextPart {
  type: 'text'
  text: string
}

export interface ToolCallPart {
  type: 'tool_call'
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolResultPart {
  type: 'tool_result'
  toolCallId: string
  content: string
  isError?: boolean
}

export type CompletionEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'thinking'; text: string }
  | { type: 'tool_call_start'; id: string; name: string }
  | { type: 'tool_call_input_delta'; id: string; delta: string }
  | { type: 'tool_call_complete'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'message_complete'; stopReason: string }
  | { type: 'error'; error: string }

export interface AgentRunOptions {
  sessionId: string
  message: string
  settings: AgentSettings
  history: ChatMessage[]
  attachedTabId?: number
  onEvent: (event: import('../../shared/types').AgentEvent) => void
  signal?: AbortSignal
}
