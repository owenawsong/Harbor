import type { ToolHandler } from '../agent/types'
import { ok, error, sendToContentScript } from './response'
import { SCREENSHOT_QUALITY } from '../../shared/constants'

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  return tab?.id
}

export const snapshotTools: ToolHandler[] = [
  {
    definition: {
      name: 'take_snapshot',
      description:
        'Get a concise snapshot of interactive elements on the current page. Returns a text representation with element IDs you can use to interact with them. Use offset/limit for pagination to avoid overwhelming context window. Set viewportOnly=true to see only visible elements.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'Tab ID to snapshot. Defaults to active tab.' },
          offset: {
            type: 'number',
            description: 'Start index for element pagination. Default: 0. Use for scrolling through large element lists.',
            minimum: 0,
          },
          limit: {
            type: 'number',
            description: 'Max elements to return. Default: 500. Lower values improve performance for large pages.',
            minimum: 1,
            maximum: 1000,
          },
          viewportOnly: {
            type: 'boolean',
            description: 'If true, only return elements visible in current viewport. Default: false. Useful for agent to focus on immediate UI.',
          },
        },
      },
    },
    async execute(input) {
      try {
        let { tabId, offset = 0, limit = 500, viewportOnly = false } = input as {
          tabId?: number
          offset?: number
          limit?: number
          viewportOnly?: boolean
        }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        // Validate pagination params
        const validOffset = Math.max(0, Math.min(offset, 10000))
        const validLimit = Math.max(1, Math.min(limit, 1000))

        const result = await sendToContentScript(tabId, {
          type: 'harbor_snapshot',
          offset: validOffset,
          limit: validLimit,
          viewportOnly,
        })
        if (!result.success) return error(result.error ?? 'Snapshot failed')

        const snapshot = result.data as { formattedText: string; elements: unknown[]; url: string; title: string }
        return ok({
          text: snapshot.formattedText,
          elementCount: (snapshot.elements as unknown[]).length,
          totalElements: (snapshot.elements as unknown[]).length, // In this batch
          offset: validOffset,
          limit: validLimit,
          url: snapshot.url,
          title: snapshot.title,
          viewportOnly,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'take_screenshot',
      description: 'Take a screenshot of the current tab.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'Tab ID to screenshot. Defaults to active tab.' },
          format: {
            type: 'string',
            enum: ['jpeg', 'png'],
            description: 'Image format. Default: jpeg.',
          },
          quality: {
            type: 'number',
            description: 'JPEG quality 0-100. Default: 85.',
            minimum: 0,
            maximum: 100,
          },
        },
      },
    },
    async execute(input, ctx) {
      try {
        let { tabId, format = 'jpeg', quality = SCREENSHOT_QUALITY } = input as {
          tabId?: number
          format?: 'jpeg' | 'png'
          quality?: number
        }
        if (!tabId) tabId = await getActiveTabId()
        const screenshot = await ctx.captureScreenshot(tabId)
        return ok({ captured: true, format }, screenshot)
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'get_page_content',
      description:
        'Get the full content of the current page as markdown text. Useful for reading articles, extracting information, or understanding page structure.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
      },
    },
    async execute(input) {
      try {
        let { tabId } = input as { tabId?: number }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, { type: 'harbor_get_content' })
        if (!result.success) return error(result.error ?? 'Failed to get content')

        const content = result.data as string
        const truncated = content.length > 50000
        return ok({
          content: truncated ? content.slice(0, 50000) + '\n\n[Content truncated...]' : content,
          length: content.length,
          truncated,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'get_page_links',
      description: 'Get all links on the current page.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
          limit: { type: 'number', description: 'Max links to return. Default: 100.', minimum: 1, maximum: 500 },
        },
      },
    },
    async execute(input) {
      try {
        let { tabId, limit = 100 } = input as { tabId?: number; limit?: number }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, { type: 'harbor_get_links' })
        if (!result.success) return error(result.error ?? 'Failed to get links')

        const links = (result.data as unknown[]).slice(0, limit)
        return ok({ links, total: (result.data as unknown[]).length, shown: links.length })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'evaluate_script',
      description:
        'Execute a JavaScript expression in the context of the current page and return the result. Useful for extracting data, checking state, or performing complex operations.',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description:
              'JavaScript expression to evaluate. Can return any JSON-serializable value. Example: "document.title" or "Array.from(document.querySelectorAll(\'h1\')).map(h => h.textContent)"',
          },
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
        required: ['expression'],
      },
    },
    async execute(input) {
      try {
        let { expression, tabId } = input as { expression: string; tabId?: number }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, { type: 'harbor_evaluate', expression })
        if (!result.success) return error(result.error ?? 'Script evaluation failed')

        return ok({ result: result.data })
      } catch (err) {
        return error(String(err))
      }
    },
  },
]
