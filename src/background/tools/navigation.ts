import type { ToolHandler } from '../agent/types'
import { ok, error, formatTabInfo, waitForNavigation } from './response'

export const navigationTools: ToolHandler[] = [
  {
    definition: {
      name: 'get_active_page',
      description: 'Get information about the currently active browser tab.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
    async execute(_input, _ctx) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab) return error('No active tab found')
        return ok(formatTabInfo(tab))
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'list_pages',
      description: 'List all open browser tabs across all windows.',
      parameters: {
        type: 'object',
        properties: {
          currentWindowOnly: {
            type: 'boolean',
            description: 'Only list tabs in the current window. Default: false.',
          },
        },
      },
    },
    async execute(input) {
      try {
        const query = input.currentWindowOnly ? { currentWindow: true } : {}
        const tabs = await chrome.tabs.query(query as chrome.tabs.QueryInfo)
        return ok({
          pages: tabs.map(formatTabInfo),
          total: tabs.length,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'navigate_to_url',
      description: 'Navigate the active tab (or a specific tab) to a URL.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The URL to navigate to. Must include http:// or https://.' },
          tabId: { type: 'number', description: 'Tab ID to navigate. Defaults to the active tab.' },
          waitForLoad: { type: 'boolean', description: 'Wait for the page to fully load before returning. Default: true.' },
        },
        required: ['url'],
      },
    },
    async execute(input) {
      try {
        let { url, tabId, waitForLoad = true } = input as { url: string; tabId?: number; waitForLoad?: boolean }

        // Ensure URL has protocol
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('chrome://') && !url.startsWith('about:')) {
          url = 'https://' + url
        }

        let targetTabId = tabId
        if (!targetTabId) {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
          targetTabId = activeTab?.id
        }

        if (!targetTabId) return error('No target tab found')

        await chrome.tabs.update(targetTabId, { url })

        if (waitForLoad) {
          await waitForNavigation(targetTabId)
        }

        const tab = await chrome.tabs.get(targetTabId)
        return ok({ navigated: true, page: formatTabInfo(tab) })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'navigate_page',
      description: 'Navigate a tab: go back, forward, reload, or to a URL.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['back', 'forward', 'reload', 'url'],
            description: 'Navigation action to perform.',
          },
          url: { type: 'string', description: 'URL to navigate to (required when action=url).' },
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
        required: ['action'],
      },
    },
    async execute(input) {
      try {
        const { action, url, tabId } = input as { action: string; url?: string; tabId?: number }

        let targetTabId = tabId
        if (!targetTabId) {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
          targetTabId = activeTab?.id
        }

        if (!targetTabId) return error('No target tab found')

        switch (action) {
          case 'back':
            await chrome.tabs.goBack(targetTabId)
            break
          case 'forward':
            await chrome.tabs.goForward(targetTabId)
            break
          case 'reload':
            await chrome.tabs.reload(targetTabId)
            break
          case 'url':
            if (!url) return error('URL required for action=url')
            await chrome.tabs.update(targetTabId, { url })
            break
          default:
            return error(`Unknown action: ${action}`)
        }

        await waitForNavigation(targetTabId)
        const tab = await chrome.tabs.get(targetTabId)
        return ok({ action, page: formatTabInfo(tab) })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'new_tab',
      description: 'Open a new browser tab, optionally at a specific URL.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to open in the new tab. Defaults to new tab page.' },
          background: { type: 'boolean', description: 'Open in background without switching to it. Default: false.' },
        },
      },
    },
    async execute(input) {
      try {
        const { url, background = false } = input as { url?: string; background?: boolean }
        const tab = await chrome.tabs.create({ url, active: !background })
        if (!background && url) {
          await waitForNavigation(tab.id!)
          const updated = await chrome.tabs.get(tab.id!)
          return ok(formatTabInfo(updated))
        }
        return ok(formatTabInfo(tab))
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'close_page',
      description: 'Close a browser tab.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'ID of the tab to close. Defaults to active tab.' },
        },
      },
    },
    async execute(input) {
      try {
        let { tabId } = input as { tabId?: number }
        if (!tabId) {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
          tabId = activeTab?.id
        }
        if (!tabId) return error('No tab to close')
        await chrome.tabs.remove(tabId)
        return ok({ closed: true, tabId })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'switch_to_page',
      description: 'Switch focus to a specific tab.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'ID of the tab to switch to.' },
        },
        required: ['tabId'],
      },
    },
    async execute(input) {
      try {
        const { tabId } = input as { tabId: number }
        await chrome.tabs.update(tabId, { active: true })
        const tab = await chrome.tabs.get(tabId)
        await chrome.windows.update(tab.windowId, { focused: true })
        return ok({ switched: true, page: formatTabInfo(tab) })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'pin_page',
      description: 'Pin or unpin a tab.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
          pinned: { type: 'boolean', description: 'True to pin, false to unpin. Default: true.' },
        },
      },
    },
    async execute(input) {
      try {
        let { tabId, pinned = true } = input as { tabId?: number; pinned?: boolean }
        if (!tabId) {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
          tabId = activeTab?.id
        }
        if (!tabId) return error('No tab found')
        const tab = await chrome.tabs.update(tabId, { pinned })
        return ok(formatTabInfo(tab!))
      } catch (err) {
        return error(String(err))
      }
    },
  },
]
