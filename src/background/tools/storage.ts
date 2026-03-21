/**
 * Browser Storage Tools
 * Access and modify localStorage, sessionStorage, and cookies
 */

import type { ToolHandler } from '../agent/types'
import { ok, error, sendToContentScript } from './response'

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  return tab?.id
}

export const storageTools: ToolHandler[] = [
  {
    definition: {
      name: 'get_local_storage',
      description: 'Read values from localStorage on the current page. Get all items or specific keys.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
          keys: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific keys to retrieve. If empty, returns all localStorage items.',
          },
        },
      },
    },
    async execute(input) {
      try {
        let { tabId, keys } = input as { tabId?: number; keys?: string[] }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, {
          type: 'harbor_get_local_storage',
          keys: keys && keys.length > 0 ? keys : undefined,
        })
        if (!result.success) return error(result.error ?? 'Failed to read localStorage')

        return ok({
          items: result.data,
          count: Object.keys(result.data as Record<string, unknown>).length,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'set_local_storage',
      description: 'Write values to localStorage on the current page.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
          items: {
            type: 'object',
            description: 'Key-value pairs to store in localStorage.',
            properties: {},
          },
        },
        required: ['items'],
      },
    },
    async execute(input) {
      try {
        let { tabId, items } = input as { tabId?: number; items: Record<string, unknown> }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        if (!items || Object.keys(items).length === 0) {
          return error('items parameter is required')
        }

        const result = await sendToContentScript(tabId, {
          type: 'harbor_set_local_storage',
          items,
        })
        if (!result.success) return error(result.error ?? 'Failed to write localStorage')

        return ok({
          stored: Object.keys(items).length,
          keys: Object.keys(items),
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'get_session_storage',
      description: 'Read values from sessionStorage on the current page.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
          keys: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific keys to retrieve. If empty, returns all sessionStorage items.',
          },
        },
      },
    },
    async execute(input) {
      try {
        let { tabId, keys } = input as { tabId?: number; keys?: string[] }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, {
          type: 'harbor_get_session_storage',
          keys: keys && keys.length > 0 ? keys : undefined,
        })
        if (!result.success) return error(result.error ?? 'Failed to read sessionStorage')

        return ok({
          items: result.data,
          count: Object.keys(result.data as Record<string, unknown>).length,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'set_session_storage',
      description: 'Write values to sessionStorage on the current page.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
          items: {
            type: 'object',
            description: 'Key-value pairs to store in sessionStorage.',
            properties: {},
          },
        },
        required: ['items'],
      },
    },
    async execute(input) {
      try {
        let { tabId, items } = input as { tabId?: number; items: Record<string, unknown> }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        if (!items || Object.keys(items).length === 0) {
          return error('items parameter is required')
        }

        const result = await sendToContentScript(tabId, {
          type: 'harbor_set_session_storage',
          items,
        })
        if (!result.success) return error(result.error ?? 'Failed to write sessionStorage')

        return ok({
          stored: Object.keys(items).length,
          keys: Object.keys(items),
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'delete_local_storage',
      description: 'Delete items from localStorage on the current page.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
          keys: {
            type: 'array',
            items: { type: 'string' },
            description: 'Keys to delete. If empty, clears all localStorage.',
          },
        },
      },
    },
    async execute(input) {
      try {
        let { tabId, keys } = input as { tabId?: number; keys?: string[] }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, {
          type: 'harbor_delete_local_storage',
          keys,
        })
        if (!result.success) return error(result.error ?? 'Failed to delete from localStorage')

        return ok({
          deleted: result.data,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },
]
