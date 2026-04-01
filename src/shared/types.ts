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

export interface ThinkingContent {
  type: 'thinking'
  thinkingText: string
}

export type MessageContent = TextContent | ToolCallContent | ToolResultContent | ImageContent | ThinkingContent

export interface ChatMessage {
  id: string
  role: MessageRole
  content: MessageContent[]
  timestamp: number
}

// ─── Provider Types ───────────────────────────────────────────────────────────

export type ProviderName = 'anthropic' | 'openai' | 'google' | 'ollama' | 'openrouter' | 'openai-compatible' | 'poe' | 'harbor-free'

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

export interface ModelPreset {
  id: string
  name: string // e.g., "Claude Sonnet 4.6", "Work model", "Secure", "OpenRouter API"
  provider: ProviderConfig
}

export interface RateLimitConfig {
  maxRetries?: number
  initialBackoffMs?: number
  maxBackoffMs?: number
  backoffMultiplier?: number
  jitterFactor?: number
}

export interface AgentSettings {
  provider: ProviderConfig
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  enableMemory?: boolean
  enableScreenshots?: boolean
  toolExecutionMode?: 'parallel' | 'sequential' // Default: parallel for speed
  rateLimitConfig?: RateLimitConfig
  toolTimeouts?: Record<string, number> // Per-tool timeout overrides (in ms)
  modelPresets?: ModelPreset[] // User-created model presets
  enablePlanning?: boolean // When true, agent creates a plan first before executing
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
  timeoutMs?: number // Optional per-tool timeout (defaults to 30s)
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
  messageId: string
}

export interface AgentEventAgentComplete {
  type: 'agent_complete'
}

export interface AgentEventRateLimited {
  type: 'rate_limited'
  waitTimeMs: number
  attemptCount: number
  messageId?: string
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
  | AgentEventRateLimited

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

export interface PortMessageContinueExecution {
  type: 'continue_execution'
  sessionId: string
}

export type PortMessage = PortMessageChat | PortMessageStop | PortMessageClearSession | PortMessageContinueExecution

// ─── Identity / Personality ───────────────────────────────────────────────────

export type ToneStyle = 'professional' | 'friendly' | 'concise' | 'detailed' | 'playful'
export type VerbosityLevel = 'brief' | 'balanced' | 'thorough'

export interface IdentitySettings {
  userName?: string
  useCases: string[]           // e.g. ['work', 'coding', 'research']
  tone: ToneStyle
  verbosity: VerbosityLevel
  useEmoji: boolean
  language: string             // BCP-47 e.g. 'en', 'zh', 'es'
  customPersonality?: string   // free text instructions
}

// ─── Appearance Settings ────────────────────────────────────────────────────────

export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl'

export interface AppearanceSettings {
  theme: 'system' | 'sunlight' | 'moonlight' | 'forest' | 'nebula' | 'sunset' | 'ocean'
  fontSize: FontSize
  compactMode: boolean
  accentColor?: string
}

// ─── Memory System ────────────────────────────────────────────────────────────

export type MemoryCategory =
  | 'identity'
  | 'preferences'
  | 'projects'
  | 'tools'
  | 'habits'
  | 'people'
  | 'general'

export interface MemoryEntry {
  id: string
  category: MemoryCategory
  content: string
  tags?: string[]
  createdAt: number
  updatedAt: number
  isPinned?: boolean
}

/**
 * User Profile - OpenAI-style comprehensive user learning
 * Builds a rich profile of the user's preferences, habits, and characteristics
 */
export interface UserProfile {
  id: string
  lastUpdated: number
  // Basic identity
  name?: string
  role?: string
  timezone?: string
  // Work habits
  workingHours?: string
  preferredLanguage?: string
  communicationStyle?: 'concise' | 'detailed' | 'technical' | 'casual'
  // Preferences
  themePreference?: 'sunlight' | 'moonlight' | 'forest' | 'nebula' | 'sunset' | 'ocean'
  responseDetailLevel?: 'brief' | 'moderate' | 'detailed'
  // Skills and expertise
  expertise?: string[] // e.g., ["Python", "React", "DevOps"]
  learningInterests?: string[]
  // Projects
  activeProjects?: string[]
  completedProjects?: string[]
  // Important people/contacts
  importantContacts?: Array<{ name: string; context?: string }>
  // Custom notes and observations
  notes?: string[]
  // Confidence score for each category (0-1)
  confidence?: {
    preferences?: number
    habits?: number
    expertise?: number
    personalityTraits?: number
  }
}

export interface UserProfileUpdate {
  field: keyof Omit<UserProfile, 'id' | 'lastUpdated' | 'confidence'>
  value: any
  source?: string // e.g., "agent_observation", "user_input"
  confidence?: number // 0-1, how sure we are about this observation
}

// ─── Skills System ────────────────────────────────────────────────────────────

export interface Skill {
  id: string
  name: string
  description: string
  icon: string              // lucide icon name
  category: SkillCategory
  instructions: string      // system prompt / instructions to agent
  isBuiltIn: boolean
  isEnabled: boolean
  createdAt?: number
  updatedAt?: number
  usageCount?: number
}

export type SkillCategory =
  | 'research'
  | 'productivity'
  | 'data'
  | 'shopping'
  | 'navigation'
  | 'content'
  | 'custom'

// ─── ModelBlend ───────────────────────────────────────────────────────────────

export type TaskType = 'coding' | 'research' | 'writing' | 'analysis' | 'chat' | 'vision' | 'math'

export interface ModelBlendRoute {
  taskType: TaskType
  provider: string
  model: string
}

export interface ModelBlendConfig {
  enabled: boolean
  routes: ModelBlendRoute[]
  classifierModel?: string    // model to classify task type
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationLevel = 'info' | 'success' | 'warning' | 'error'

export interface HarborNotification {
  id: string
  level: NotificationLevel
  title: string
  body?: string
  timestamp: number
  isRead: boolean
  actionLabel?: string
  actionUrl?: string
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export interface OnboardingData {
  completed: boolean
  userName?: string
  useCases: string[]
  tone: ToneStyle
  theme: 'system' | 'sunlight' | 'moonlight' | 'forest' | 'nebula' | 'sunset' | 'ocean'
  language: string
  completedAt?: number
}

// ─── Storage Types ────────────────────────────────────────────────────────────

export interface StoredSettings {
  agentSettings: AgentSettings
  theme: 'system' | 'sunlight' | 'moonlight' | 'forest' | 'nebula' | 'sunset' | 'ocean'
  identity?: IdentitySettings
  modelBlend?: ModelBlendConfig
  notifications?: {
    enabled: boolean
    agentComplete: boolean
    errors: boolean
  }
  keybindings?: Record<string, string>
}

export interface StoredSession {
  id: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  title?: string
  isPinned?: boolean
  tags?: string[]
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
