import React, { useState } from 'react'
import {
  ChevronRight, ChevronDown,
  Loader2, CheckCircle2, XCircle,
  Globe, RefreshCw, Plus, X, ArrowLeftRight, List, FileText,
  Eye, Camera, Link2, Zap, MousePointer2, Type, Trash2,
  Keyboard, ArrowUpDown, Focus, CheckSquare, MessageSquare,
  GripHorizontal, LayoutGrid, Search, Bookmark, Download, Save,
  Clock, Square, Layers, Wrench,
} from 'lucide-react'
import type { UIToolCall } from '../hooks/useChat'

// ─── Icon Map ─────────────────────────────────────────────────────────────────

type Icon = React.ComponentType<{ size?: number; className?: string }>

const TOOL_ICON_MAP: Record<string, Icon> = {
  navigate_to_url:    Globe,
  navigate_page:      RefreshCw,
  new_tab:            Plus,
  close_page:         X,
  switch_to_page:     ArrowLeftRight,
  list_pages:         List,
  get_active_page:    FileText,
  take_snapshot:      Eye,
  take_screenshot:    Camera,
  get_page_content:   FileText,
  get_page_links:     Link2,
  evaluate_script:    Zap,
  click:              MousePointer2,
  click_at:           MousePointer2,
  fill:               Type,
  clear:              Trash2,
  press_key:          Keyboard,
  scroll:             ArrowUpDown,
  hover:              MousePointer2,
  focus:              Focus,
  select_option:      ChevronDown,
  check:              CheckSquare,
  handle_dialog:      MessageSquare,
  drag:               GripHorizontal,
  get_dom:            LayoutGrid,
  search_dom:         Search,
  search_bookmarks:   Bookmark,
  get_bookmarks:      Bookmark,
  add_bookmark:       Bookmark,
  delete_bookmark:    Trash2,
  search_history:     Clock,
  get_recent_history: Clock,
  list_windows:       Square,
  new_window:         Square,
  list_tab_groups:    Layers,
  create_tab_group:   Layers,
  download_file:      Download,
  save_content_to_file: Save,
}

function getIcon(name: string): Icon {
  return TOOL_ICON_MAP[name] ?? Wrench
}

function formatName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function getSummary(tc: UIToolCall): string {
  const inp = tc.input ?? {}
  switch (tc.name) {
    case 'navigate_to_url':
    case 'navigate_page':  return (inp.url ?? inp.action ?? '') as string
    case 'click':          return `#${inp.elementId ?? inp.selector ?? ''}`
    case 'fill':           return `"${String(inp.text ?? '').slice(0, 35)}"`
    case 'press_key':      return String(inp.key ?? '')
    case 'search_history':
    case 'search_bookmarks':
    case 'search_dom':     return `"${inp.query ?? ''}"`
    case 'evaluate_script':return String(inp.expression ?? '').slice(0, 40)
    case 'scroll':         return `${inp.direction} ${inp.amount ?? 300}px`
    case 'take_screenshot':return 'capturing screenshot'
    case 'take_snapshot':  return 'reading page'
    case 'get_page_content':return 'reading content'
    default:               return ''
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ToolCallDisplay({ toolCall }: { toolCall: UIToolCall }) {
  const [open, setOpen] = useState(false)
  const Icon = getIcon(toolCall.name)
  const summary = getSummary(toolCall)
  const hasDetails = toolCall.input !== undefined || toolCall.result !== undefined

  return (
    <div className="rounded-lg border border-[rgb(var(--harbor-border))] overflow-hidden text-xs">
      {/* Header row */}
      <button
        onClick={() => hasDetails && setOpen((v) => !v)}
        className={`flex items-center gap-2 w-full px-2.5 py-2 bg-[rgb(var(--harbor-surface-2))] text-left ${hasDetails ? 'cursor-pointer hover:bg-[rgb(var(--harbor-border))]' : 'cursor-default'}`}
        style={{ transition: 'background-color 150ms' }}
      >
        {/* Status */}
        <span className="flex-shrink-0">
          {toolCall.status === 'running' && <Loader2 size={12} className="animate-spin text-harbor-500" />}
          {toolCall.status === 'done'    && <CheckCircle2 size={12} className="text-emerald-500" />}
          {toolCall.status === 'error'   && <XCircle size={12} className="text-red-500" />}
          {toolCall.status === 'pending' && <div className="w-3 h-3 rounded-full border border-[rgb(var(--harbor-border-2))]" />}
        </span>

        {/* Tool icon */}
        <Icon size={12} className="flex-shrink-0 text-[rgb(var(--harbor-text-muted))]" />

        {/* Name */}
        <span className="font-medium text-[rgb(var(--harbor-text))]">{formatName(toolCall.name)}</span>

        {/* Summary */}
        {summary && (
          <span className="text-[rgb(var(--harbor-text-faint))] truncate flex-1 min-w-0 font-mono">
            {summary}
          </span>
        )}

        {/* Expand chevron */}
        {hasDetails && (
          <span className="flex-shrink-0 ml-auto text-[rgb(var(--harbor-text-faint))]">
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
        )}
      </button>

      {/* Expanded details */}
      {open && hasDetails && (
        <div className="border-t border-[rgb(var(--harbor-border))] divide-y divide-[rgb(var(--harbor-border))]">
          {/* Screenshot */}
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
            <div className="px-2.5 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--harbor-text-faint))] mb-1.5">Input</div>
              <pre className="text-[rgb(var(--harbor-text))] font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all">
                {JSON.stringify(toolCall.input, null, 2)}
              </pre>
            </div>
          )}

          {/* Result */}
          {toolCall.result && (
            <div className="px-2.5 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--harbor-text-faint))] mb-1.5">
                {toolCall.result.success ? 'Result' : 'Error'}
              </div>
              {toolCall.result.error ? (
                <p className="text-red-500">{toolCall.result.error}</p>
              ) : (
                <pre className="text-[rgb(var(--harbor-text))] font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-all max-h-40 overflow-y-auto harbor-scroll">
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
