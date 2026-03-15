import React, { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Loader2, Terminal } from 'lucide-react'
import type { UIToolCall } from '../hooks/useChat'

interface ToolCallDisplayProps {
  toolCall: UIToolCall
}

const TOOL_ICONS: Record<string, string> = {
  navigate_to_url: '🌐',
  navigate_page: '🔄',
  new_tab: '➕',
  close_page: '✖️',
  switch_to_page: '🔀',
  list_pages: '📑',
  get_active_page: '📄',
  take_snapshot: '👁️',
  take_screenshot: '📸',
  get_page_content: '📋',
  get_page_links: '🔗',
  evaluate_script: '⚡',
  click: '🖱️',
  click_at: '🖱️',
  fill: '✏️',
  clear: '🗑️',
  press_key: '⌨️',
  scroll: '↕️',
  hover: '🖱️',
  focus: '🎯',
  select_option: '📋',
  check: '☑️',
  handle_dialog: '💬',
  drag: '↔️',
  get_dom: '🏗️',
  search_dom: '🔍',
  search_bookmarks: '🔖',
  get_bookmarks: '🔖',
  add_bookmark: '🔖',
  delete_bookmark: '🗑️',
  search_history: '🕐',
  get_recent_history: '🕐',
  list_windows: '🪟',
  new_window: '🪟',
  list_tab_groups: '📁',
  create_tab_group: '📁',
  download_file: '⬇️',
  save_content_to_file: '💾',
}

function getToolIcon(name: string): string {
  return TOOL_ICONS[name] ?? '🔧'
}

function formatToolName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function getToolSummary(toolCall: UIToolCall): string {
  const input = toolCall.input ?? {}

  switch (toolCall.name) {
    case 'navigate_to_url':
    case 'navigate_page':
      return (input.url as string) ?? (input.action as string) ?? ''
    case 'click':
      return `Element ${input.elementId ?? input.selector ?? ''}`
    case 'fill':
      return `"${String(input.text ?? '').slice(0, 30)}${String(input.text ?? '').length > 30 ? '...' : ''}"`
    case 'press_key':
      return `"${input.key}"`
    case 'search_history':
    case 'search_bookmarks':
    case 'search_dom':
      return `"${input.query ?? ''}"`
    case 'evaluate_script':
      return String(input.expression ?? '').slice(0, 40)
    case 'scroll':
      return `${input.direction} ${input.amount ?? 300}px`
    case 'take_screenshot':
      return 'Capturing screenshot...'
    case 'take_snapshot':
      return 'Reading page elements...'
    case 'get_page_content':
      return 'Reading page content...'
    default:
      return ''
  }
}

export default function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const [expanded, setExpanded] = useState(false)
  const hasDetails = toolCall.result !== undefined || toolCall.input !== undefined
  const summary = getToolSummary(toolCall)

  return (
    <div className="border border-[rgb(var(--harbor-border))] rounded-lg overflow-hidden text-xs">
      {/* Header */}
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`flex items-center gap-2 w-full px-3 py-2 bg-[rgb(var(--harbor-surface))] hover:brightness-95 transition-all text-left ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {/* Status icon */}
        <span className="flex-shrink-0">
          {toolCall.status === 'running' && (
            <Loader2 size={13} className="text-harbor-500 animate-spin" />
          )}
          {toolCall.status === 'done' && (
            <CheckCircle size={13} className="text-green-500" />
          )}
          {toolCall.status === 'error' && (
            <XCircle size={13} className="text-red-500" />
          )}
          {toolCall.status === 'pending' && (
            <div className="w-3 h-3 rounded-full border-2 border-[rgb(var(--harbor-border))]" />
          )}
        </span>

        {/* Tool icon + name */}
        <span className="flex-shrink-0">{getToolIcon(toolCall.name)}</span>
        <span className="font-medium text-[rgb(var(--harbor-text))]">{formatToolName(toolCall.name)}</span>

        {/* Summary */}
        {summary && (
          <span className="text-[rgb(var(--harbor-text-muted))] truncate flex-1 min-w-0">
            {summary}
          </span>
        )}

        {/* Expand toggle */}
        {hasDetails && (
          <span className="flex-shrink-0 text-[rgb(var(--harbor-text-muted))] ml-auto">
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        )}
      </button>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div className="border-t border-[rgb(var(--harbor-border))] bg-[rgb(var(--harbor-bg))]">
          {/* Screenshot result */}
          {toolCall.result?.screenshot && (
            <div className="p-2">
              <img
                src={toolCall.result.screenshot}
                alt="Screenshot"
                className="w-full rounded border border-[rgb(var(--harbor-border))]"
              />
            </div>
          )}

          {/* Input */}
          {toolCall.input && Object.keys(toolCall.input).length > 0 && (
            <div className="px-3 py-2 border-b border-[rgb(var(--harbor-border))]">
              <div className="text-[rgb(var(--harbor-text-muted))] mb-1 font-medium uppercase tracking-wide text-[10px]">Input</div>
              <pre className="text-[rgb(var(--harbor-text))] whitespace-pre-wrap break-all overflow-x-auto">
                {JSON.stringify(toolCall.input, null, 2)}
              </pre>
            </div>
          )}

          {/* Result */}
          {toolCall.result && (
            <div className="px-3 py-2">
              <div className="text-[rgb(var(--harbor-text-muted))] mb-1 font-medium uppercase tracking-wide text-[10px]">
                {toolCall.result.success ? 'Result' : 'Error'}
              </div>
              {toolCall.result.error ? (
                <div className="text-red-500">{toolCall.result.error}</div>
              ) : (
                <pre className="text-[rgb(var(--harbor-text))] whitespace-pre-wrap break-all overflow-x-auto max-h-48 overflow-y-auto harbor-scrollbar">
                  {typeof toolCall.result.output === 'string'
                    ? toolCall.result.output
                    : JSON.stringify(toolCall.result.output, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
