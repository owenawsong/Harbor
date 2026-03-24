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

  {
    definition: {
      name: 'save_to_memory',
      description: 'Save important information about the user to persistent memory. Use this to remember facts about the user, their preferences, goals, timeline, or any other important information.',
      parameters: {
        type: 'object',
        properties: {
          fact: {
            type: 'string',
            description: 'The important fact or information to remember. Be specific and clear. Example: "User prefers concise responses" or "Owen is the user\'s name" or "Project deadline is March 30"',
          },
          category: {
            type: 'string',
            enum: ['personal', 'preferences', 'work', 'goals', 'other'],
            description: 'Category for organizing the memory. personal=name/bio, preferences=how they like communication, work=projects/tasks, goals=objectives, other=miscellaneous',
          },
        },
        required: ['fact', 'category'],
      },
    },
    async execute(input) {
      try {
        const { fact, category } = input as { fact: string; category: string }

        if (!fact || fact.trim().length === 0) {
          return error('fact parameter is required and must not be empty')
        }

        // Load existing memory
        const storageData = await new Promise<Record<string, any>>((resolve) => {
          chrome.storage.local.get('harbor_user_profile', (data) => {
            resolve(data)
          })
        })

        let profileLines = storageData.harbor_user_profile?.split('\n').filter((l: string) => l.trim()) || []

        // Remove empty lines and add new fact with category
        profileLines = profileLines.filter((line: string) => line.trim().length > 0)
        const timestamp = new Date().toISOString().split('T')[0]
        const newLine = `[${category.toUpperCase()}] ${fact} (${timestamp})`

        // Check if similar fact exists to avoid duplicates
        const isDuplicate = profileLines.some((line: string) =>
          line.toLowerCase().includes(fact.toLowerCase())
        )

        if (!isDuplicate) {
          profileLines.push(newLine)
        }

        // Save back to storage
        await new Promise<void>((resolve) => {
          chrome.storage.local.set({
            harbor_user_profile: profileLines.join('\n'),
          }, () => {
            resolve()
          })
        })

        return ok({
          saved: true,
          fact: fact,
          category: category,
          message: `Remembered: ${fact}`,
        })
      } catch (err) {
        return error(`Failed to save to memory: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  {
    definition: {
      name: 'read_user_memory',
      description: 'Read the user\'s stored memory/profile. Returns all facts organized by category.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['personal', 'preferences', 'work', 'goals', 'other'],
            description: 'Optional: filter by category. If not provided, returns all memories.',
          },
        },
      },
    },
    async execute(input) {
      try {
        const { category } = input as { category?: string }

        const storageData = await new Promise<Record<string, any>>((resolve) => {
          chrome.storage.local.get('harbor_user_profile', (data) => {
            resolve(data)
          })
        })

        const profileLines = storageData.harbor_user_profile?.split('\n').filter((l: string) => l.trim()) || []

        let memories = profileLines
        if (category) {
          const categoryUpper = category.toUpperCase()
          memories = profileLines.filter((line: string) => line.startsWith(`[${categoryUpper}]`))
        }

        // Parse into structured format
        const parsed = memories.map((line: string) => {
          const match = line.match(/\[(.*?)\]\s+(.*?)\s+\((.*?)\)/)
          if (match) {
            return {
              category: match[1].toLowerCase(),
              fact: match[2],
              date: match[3],
            }
          }
          return { raw: line }
        })

        return ok({
          count: parsed.length,
          memories: parsed,
          total_stored: profileLines.length,
        })
      } catch (err) {
        return error(`Failed to read memory: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  {
    definition: {
      name: 'update_user_memory',
      description: 'Update or modify an existing memory fact. Find and replace specific information.',
      parameters: {
        type: 'object',
        properties: {
          old_fact: {
            type: 'string',
            description: 'The original fact or part of it to find. Will search for this text.',
          },
          new_fact: {
            type: 'string',
            description: 'The new fact or information to replace it with.',
          },
          category: {
            type: 'string',
            enum: ['personal', 'preferences', 'work', 'goals', 'other'],
            description: 'Category for the updated fact.',
          },
        },
        required: ['old_fact', 'new_fact', 'category'],
      },
    },
    async execute(input) {
      try {
        const { old_fact, new_fact, category } = input as { old_fact: string; new_fact: string; category: string }

        const storageData = await new Promise<Record<string, any>>((resolve) => {
          chrome.storage.local.get('harbor_user_profile', (data) => {
            resolve(data)
          })
        })

        let profileLines = storageData.harbor_user_profile?.split('\n').filter((l: string) => l.trim()) || []

        // Find and replace the fact
        const timestamp = new Date().toISOString().split('T')[0]
        const newLine = `[${category.toUpperCase()}] ${new_fact} (${timestamp})`

        let found = false
        profileLines = profileLines.map((line: string) => {
          if (line.toLowerCase().includes(old_fact.toLowerCase())) {
            found = true
            return newLine
          }
          return line
        })

        if (!found) {
          return error(`Fact not found: "${old_fact}" - nothing was updated`)
        }

        // Save back to storage
        await new Promise<void>((resolve) => {
          chrome.storage.local.set({
            harbor_user_profile: profileLines.join('\n'),
          }, () => {
            resolve()
          })
        })

        return ok({
          updated: true,
          old_fact,
          new_fact,
          message: `Updated memory: "${old_fact}" → "${new_fact}"`,
        })
      } catch (err) {
        return error(`Failed to update memory: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  {
    definition: {
      name: 'delete_user_memory',
      description: 'Delete a specific memory fact or all memories in a category.',
      parameters: {
        type: 'object',
        properties: {
          fact: {
            type: 'string',
            description: 'Specific fact or text to find and delete. If not provided with category, searches all memories.',
          },
          category: {
            type: 'string',
            enum: ['personal', 'preferences', 'work', 'goals', 'other'],
            description: 'Optional: delete all facts in a category. Use with or without fact parameter.',
          },
        },
      },
    },
    async execute(input) {
      try {
        const { fact, category } = input as { fact?: string; category?: string }

        if (!fact && !category) {
          return error('Either fact or category (or both) is required')
        }

        const storageData = await new Promise<Record<string, any>>((resolve) => {
          chrome.storage.local.get('harbor_user_profile', (data) => {
            resolve(data)
          })
        })

        let profileLines = storageData.harbor_user_profile?.split('\n').filter((l: string) => l.trim()) || []
        const originalCount = profileLines.length

        // Filter out matching lines
        if (fact && category) {
          const categoryUpper = category.toUpperCase()
          profileLines = profileLines.filter((line: string) =>
            !(line.startsWith(`[${categoryUpper}]`) && line.toLowerCase().includes(fact.toLowerCase()))
          )
        } else if (category) {
          const categoryUpper = category.toUpperCase()
          profileLines = profileLines.filter((line: string) => !line.startsWith(`[${categoryUpper}]`))
        } else if (fact) {
          profileLines = profileLines.filter((line: string) =>
            !line.toLowerCase().includes(fact.toLowerCase())
          )
        }

        const deletedCount = originalCount - profileLines.length

        if (deletedCount === 0) {
          return error('No matching memories found to delete')
        }

        // Save back to storage
        await new Promise<void>((resolve) => {
          chrome.storage.local.set({
            harbor_user_profile: profileLines.length > 0 ? profileLines.join('\n') : '',
          }, () => {
            resolve()
          })
        })

        return ok({
          deleted: true,
          deleted_count: deletedCount,
          remaining: profileLines.length,
          message: `Deleted ${deletedCount} memory fact(s)`,
        })
      } catch (err) {
        return error(`Failed to delete from memory: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },
]
