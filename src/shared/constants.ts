export const EXTENSION_NAME = 'Harbor'
export const VERSION = '1.23.0'
export const PORT_NAME = 'harbor-agent'
export const STORAGE_KEYS = {
  SETTINGS: 'harbor_settings',
  SESSIONS: 'harbor_sessions',
  CURRENT_SESSION: 'harbor_current_session',
  LAST_SESSION: 'harbor_last_session',
  MEMORY: 'harbor_memory',
} as const

export const DEFAULT_MODELS: Record<string, string[]> = {
  anthropic: [
    'claude-opus-4-5-20251101',
    'claude-sonnet-4-5-20251022',
    'claude-haiku-4-5-20251022',
    'claude-opus-4-5',
    'claude-sonnet-4-5',
  ],
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'o1-preview',
    'o1-mini',
  ],
  google: [
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash-latest',
    'gemini-1.0-pro',
  ],
  ollama: [
    'llama3.2',
    'llama3.1',
    'qwen2.5',
    'mistral',
    'codellama',
    'deepseek-r1',
  ],
  openrouter: [
    'anthropic/claude-opus-4-5',
    'anthropic/claude-sonnet-4-5',
    'openai/gpt-4o',
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.2-90b-vision-instruct',
    'mistralai/mistral-large',
  ],
  'openai-compatible': [],
  poe: [
    'Claude-3-7-Sonnet',
    'GPT-4o',
    'Gemini-1.5-Pro',
    'Claude-3-5-Sonnet',
    'Llama-3.1-405B-T',
    'Gemini-2.0-Flash-Thinking',
    'DeepSeek-R1',
    'o3-mini',
    'Grok-2',
  ],
  'harbor-free': ['minimaxai/minimax-m2.5', 'qwen/qwen3.5-122b-a10b'],
}

export const PROVIDER_LABELS: Record<string, string> = {
  'harbor-free': 'Harbor Free ✦',
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT)',
  google: 'Google (Gemini)',
  ollama: 'Ollama (Local)',
  openrouter: 'OpenRouter',
  'openai-compatible': 'OpenAI-Compatible',
  poe: 'Poe',
}

export const API_ENDPOINTS: Record<string, string> = {
  anthropic: 'https://api.anthropic.com/v1/messages',
  openai: 'https://api.openai.com/v1/chat/completions',
  google: 'https://generativelanguage.googleapis.com/v1beta/models',
  ollama: 'http://localhost:11434/api/chat',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
}

// ─── Harbor Free Configuration (NVIDIA NIM) ───────────────────────────────
// Harbor Free service configuration
// Users MUST configure NVIDIA API key via VITE_HARBOR_FREE_API_KEY env var
// Can be configured via VITE_HARBOR_FREE_API_KEY and VITE_HARBOR_FREE_BASE_URL env vars
export const HARBOR_FREE_CONFIG = {
  apiKey: import.meta.env.VITE_HARBOR_FREE_API_KEY || '',
  baseUrl: import.meta.env.VITE_HARBOR_FREE_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  textModel: 'minimaxai/minimax-m2.5',
  imageModel: 'qwen/qwen3.5-122b-a10b',
}

export const MAX_TOOL_ITERATIONS = 50
export const MAX_TOKENS = 8192
export const SCREENSHOT_QUALITY = 85

export const CONTENT_SCRIPT_TIMEOUT = 10000 // 10 seconds

export const HARBOR_ELEMENT_ATTR = 'data-harbor-id'

// ─── Message Types (to avoid magic strings) ────────────────────────────────────

export const MESSAGE_TYPES = {
  // Chat messages
  CHAT: 'chat',
  STOP: 'stop',
  CLEAR_SESSION: 'clear_session',

  // Settings
  GET_SETTINGS: 'get_settings',
  SAVE_SETTINGS: 'save_settings',

  // Sessions
  GET_SESSIONS: 'get_sessions',
  GET_SESSION: 'get_session',
  DELETE_SESSION: 'delete_session',

  // Tab operations
  GET_ACTIVE_TAB: 'get_active_tab',

  // Command palette
  TOGGLE_PALETTE: 'harbor_toggle_palette',
  GET_PALETTE_COMMANDS: 'harbor_get_palette_commands',
  EXECUTE_PALETTE_COMMAND: 'harbor_execute_palette_command',
  PALETTE_COMMAND_EXECUTE: 'harbor_palette_command_execute',

  // Agent indicators
  AGENT_RUNNING: 'harbor_agent_running',
  AGENT_STOPPED: 'harbor_agent_stopped',
  AGENT_START: 'harbor_agent_start',
} as const
