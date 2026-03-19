/**
 * Data Extraction Tools
 * Extract structured data from web pages
 */

import type { ToolHandler } from '../agent/types'
import { ok, error, sendToContentScript } from './response'

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  return tab?.id
}

export const extractionTools: ToolHandler[] = [
  {
    definition: {
      name: 'extract_tables',
      description:
        'Extract all tables from the current page and convert them to JSON or Markdown format. Useful for data extraction from tabular content.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
          format: {
            type: 'string',
            enum: ['json', 'markdown', 'csv'],
            description: 'Output format for tables. Default: json.',
          },
          maxTables: {
            type: 'number',
            description: 'Maximum number of tables to extract. Default: 20.',
            minimum: 1,
            maximum: 100,
          },
        },
      },
    },
    async execute(input) {
      try {
        let { tabId, format = 'json', maxTables = 20 } = input as {
          tabId?: number
          format?: 'json' | 'markdown' | 'csv'
          maxTables?: number
        }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, {
          type: 'harbor_extract_tables',
          format,
          maxTables,
        })
        if (!result.success) return error(result.error ?? 'Failed to extract tables')

        return ok({
          tables: result.data,
          count: (result.data as unknown[]).length,
          format,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'get_selected_text',
      description:
        'Get the currently selected/highlighted text on the page. Useful for extracting user-selected content or reading highlighted passages.',
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

        const result = await sendToContentScript(tabId, {
          type: 'harbor_get_selected_text',
        })
        if (!result.success) return error(result.error ?? 'Failed to get selected text')

        const selectedText = result.data as string
        return ok({
          text: selectedText,
          length: selectedText.length,
          isEmpty: selectedText.trim().length === 0,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'extract_structured_data',
      description:
        'Extract structured data from the page based on CSS selectors. Useful for scraping specific fields from a page.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
          selectors: {
            type: 'object',
            description: 'Key-value pairs of name -> CSS selector. Returns all matching elements for each selector.',
            properties: {},
          },
          limit: {
            type: 'number',
            description: 'Maximum results per selector. Default: 20.',
            minimum: 1,
            maximum: 100,
          },
        },
        required: ['selectors'],
      },
    },
    async execute(input) {
      try {
        let { tabId, selectors, limit = 20 } = input as {
          tabId?: number
          selectors: Record<string, string>
          limit?: number
        }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        if (!selectors || Object.keys(selectors).length === 0) {
          return error('selectors parameter is required')
        }

        const result = await sendToContentScript(tabId, {
          type: 'harbor_extract_by_selector',
          selectors,
          limit,
        })
        if (!result.success) return error(result.error ?? 'Failed to extract data')

        return ok({
          data: result.data,
          count: Object.keys(result.data).length,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },
]
