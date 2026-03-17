// ─── Message Types ────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'tool_result'

export interface TextContent {
  type: 'text'
  text: string
}

export interface ToolCallContent {
  type: 'tool_call'
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolResultContent {
  type: 'tool_result'
  toolCallId: string
  result: unknown
  isError?: boolean
}

export interface ImageContent {
  type: 'image'
  url: string
  mimeType?: string
}

export type MessageContent = TextContent | ToolCallContent | ToolResultContent | ImageContent

export interface ChatMessage {
  id: string
  role: MessageRole
  content: MessageContent[]
  timestamp: number
}

// ─── Provider Types ───────────────────────────────────────────────────────────

export type ProviderName = 'anthropic' | 'openai' | 'google' | 'ollama' | 'openrouter' | 'openai-compatible' | 'poe'

export interface ProviderConfig {
  provider: ProviderName
  apiKey?: string
  model: string
  baseUrl?: string
  // Azure specific
  resourceName?: string
  // AWS Bedrock specific
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
}

export interface AgentSettings {
  provider: ProviderConfig
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  enableMemory?: boolean
  enableScreenshots?: boolean
}

// ─── Tool Types ───────────────────────────────────────────────────────────────

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description?: string
  enum?: string[]
  items?: ToolParameter
  properties?: Record<string, ToolParameter>
  required?: string[]
  default?: unknown
  minimum?: number
  maximum?: number
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, ToolParameter>
    required?: string[]
  }
}

export interface ToolResult {
  success: boolean
  output?: unknown
  error?: string
  screenshot?: string // base64 data URL
}

// ─── Agent Event Types (port messages) ────────────────────────────────────────

export interface AgentEventTextDelta {
  type: 'text_delta'
  text: string
  messageId: string
}

export interface AgentEventToolCallStart {
  type: 'tool_call_start'
  messageId: string
  toolCallId: string
  toolName: string
}

export interface AgentEventToolCallInput {
  type: 'tool_call_input'
  toolCallId: string
  partialInput: string
}

export interface AgentEventToolCallResult {
  type: 'tool_call_result'
  toolCallId: string
  toolName: string
  result: ToolResult
}

export interface AgentEventMessageComplete {
  type: 'message_complete'
  messageId: string
  stopReason: string
}

export interface AgentEventError {
  type: 'error'
  error: string
}

export interface AgentEventThinking {
  type: 'thinking'
  text: string
}

export interface AgentEventAgentComplete {
  type: 'agent_complete'
}

export type AgentEvent =
  | AgentEventTextDelta
  | AgentEventToolCallStart
  | AgentEventToolCallInput
  | AgentEventToolCallResult
  | AgentEventMessageComplete
  | AgentEventError
  | AgentEventThinking
  | AgentEventAgentComplete

// ─── Port Message Types ───────────────────────────────────────────────────────

export interface PortMessageChat {
  type: 'chat'
  sessionId: string
  message: string
  attachedTabId?: number
}

export interface PortMessageStop {
  type: 'stop'
  sessionId: string
}

export interface PortMessageClearSession {
  type: 'clear_session'
  sessionId: string
}

export type PortMessage = PortMessageChat | PortMessageStop | PortMessageClearSession

// ─── Storage Types ────────────────────────────────────────────────────────────

export interface StoredSettings {
  agentSettings: AgentSettings
  theme: 'light' | 'dark' | 'system'
}

export interface StoredSession {
  id: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  title?: string
}

// ─── Browser Context ──────────────────────────────────────────────────────────

export interface PageInfo {
  id: number
  url: string
  title: string
  isLoading: boolean
  isPinned: boolean
  windowId: number
  index: number
  groupId?: number
}

export interface WindowInfo {
  id: number
  tabs: PageInfo[]
  isFocused: boolean
  type: string
}

// ─── Snapshot Types ───────────────────────────────────────────────────────────

export interface SnapshotElement {
  id: number
  tag: string
  role: string
  text: string
  name?: string
  href?: string
  type?: string
  value?: string
  checked?: boolean
  disabled?: boolean
  placeholder?: string
  x: number
  y: number
  width: number
  height: number
}

export interface PageSnapshot {
  url: string
  title: string
  elements: SnapshotElement[]
  formattedText: string
}
