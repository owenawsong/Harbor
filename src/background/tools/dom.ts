import type { ToolHandler } from '../agent/types'
import { ok, error, sendToContentScript } from './response'

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab?.id
}

export const domTools: ToolHandler[] = [
  {
    definition: {
      name: 'get_dom',
      description: 'Get the raw HTML of the page or a specific element.',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector to get HTML for. Defaults to document.body.' },
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
      },
    },
    async execute(input) {
      try {
        let { selector, tabId } = input as { selector?: string; tabId?: number }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, { type: 'harbor_get_dom', selector })
        if (!result.success) return error(result.error ?? 'Failed to get DOM')

        const html = result.data as string
        const truncated = html.length > 100000
        return ok({
          html: truncated ? html.slice(0, 100000) + '...' : html,
          length: html.length,
          truncated,
          selector: selector ?? 'body',
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'search_dom',
      description:
        'Search the DOM for elements matching a CSS selector, XPath, or containing text.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'CSS selector, XPath, or text to search for.' },
          limit: { type: 'number', description: 'Maximum results to return. Default: 20.', minimum: 1, maximum: 200 },
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
        required: ['query'],
      },
    },
    async execute(input) {
      try {
        let { query, limit = 20, tabId } = input as { query: string; limit?: number; tabId?: number }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, { type: 'harbor_search_dom', query, limit })
        if (!result.success) return error(result.error ?? 'DOM search failed')

        return ok(result.data)
      } catch (err) {
        return error(String(err))
      }
    },
  },
]
