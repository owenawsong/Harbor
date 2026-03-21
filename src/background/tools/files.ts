/**
 * File & Modal Tools
 * Handle file uploads, modal detection, and dialog interactions
 */

import type { ToolHandler } from '../agent/types'
import { ok, error, sendToContentScript } from './response'

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  return tab?.id
}

export const fileTools: ToolHandler[] = [
  {
    definition: {
      name: 'find_file_input',
      description: 'Find file input elements on the page and return their IDs and labels.',
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
          type: 'harbor_find_file_inputs',
        })
        if (!result.success) return error(result.error ?? 'Failed to find file inputs')

        return ok({
          inputs: result.data,
          count: (result.data as unknown[]).length,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'detect_modal',
      description:
        'Detect if a modal, dialog, or overlay is currently visible on the page. Returns modal details if found.',
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
          type: 'harbor_detect_modal',
        })
        if (!result.success) return error(result.error ?? 'Failed to detect modal')

        const { isPresent, modal } = result.data as { isPresent: boolean; modal?: Record<string, unknown> }

        if (!isPresent) {
          return ok({
            isPresent: false,
            message: 'No modal detected',
          })
        }

        return ok({
          isPresent: true,
          modal,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'wait_for_modal',
      description: 'Wait for a modal or dialog to appear on the page (up to 30 seconds).',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds. Default: 30000 (30 seconds).',
            minimum: 1000,
            maximum: 120000,
          },
        },
      },
    },
    async execute(input) {
      try {
        let { tabId, timeout = 30000 } = input as { tabId?: number; timeout?: number }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, {
          type: 'harbor_wait_for_modal',
          timeout,
        })
        if (!result.success) return error(result.error ?? 'Modal detection failed')

        const { found, modal } = result.data as { found: boolean; modal?: Record<string, unknown> }

        if (!found) {
          return error(`No modal appeared within ${timeout}ms`)
        }

        return ok({
          found: true,
          modal,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'close_modal',
      description: 'Close a visible modal or dialog by clicking the close button, pressing Escape, or confirming.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
          method: {
            type: 'string',
            enum: ['escape', 'close_button', 'confirm', 'dismiss'],
            description: 'How to close the modal. Default: escape.',
          },
        },
      },
    },
    async execute(input) {
      try {
        let { tabId, method = 'escape' } = input as { tabId?: number; method?: string }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, {
          type: 'harbor_close_modal',
          method,
        })
        if (!result.success) return error(result.error ?? 'Failed to close modal')

        return ok({
          closed: true,
          method,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },
]
