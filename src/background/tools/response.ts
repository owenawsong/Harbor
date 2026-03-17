import type { ToolResult } from '../../shared/types'

export function ok(output: unknown, screenshot?: string): ToolResult {
  return { success: true, output, screenshot }
}

export function error(message: string): ToolResult {
  return { success: false, error: message }
}

export function formatTabInfo(tab: chrome.tabs.Tab): Record<string, unknown> {
  return {
    id: tab.id,
    url: tab.url,
    title: tab.title,
    isLoading: tab.status === 'loading',
    isPinned: tab.pinned,
    windowId: tab.windowId,
    index: tab.index,
    groupId: tab.groupId,
  }
}

export function formatWindowInfo(win: chrome.windows.Window): Record<string, unknown> {
  return {
    id: win.id,
    isFocused: win.focused,
    type: win.type,
    state: win.state,
    tabCount: win.tabs?.length ?? 0,
  }
}

export async function waitForNavigation(tabId: number, timeoutMs = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener)
      resolve() // Don't reject on timeout, just continue
    }, timeoutMs)

    function listener(updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timer)
        chrome.tabs.onUpdated.removeListener(listener)
        // Small delay to let JS initialize
        setTimeout(resolve, 500)
      }
    }

    chrome.tabs.onUpdated.addListener(listener)
  })
}

export async function ensureContentScript(tabId: number): Promise<void> {
  // Check if already loaded
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'harbor_ping' })
    return // Already running
  } catch {
    // Not loaded, inject it
  }

  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] })
  } catch {
    // Page may not allow injection (chrome:// pages, PDFs, etc.) — silently continue
    return
  }

  // Retry ping up to 5 times (300ms each) to wait for content script to initialize
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 300))
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'harbor_ping' })
      return // Ready
    } catch {
      continue
    }
  }
}

export async function sendToContentScript(tabId: number, message: unknown): Promise<{ success: boolean; data?: unknown; error?: string }> {
  await ensureContentScript(tabId)
  try {
    const result = await chrome.tabs.sendMessage(tabId, message)
    return result
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
