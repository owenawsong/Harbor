/**
 * Browser Storage Tools
 * Access and modify localStorage, sessionStorage, and cookies
 */

import type { ToolHandler } from '../agent/types'
import { ok, error, sendToContentScript } from './response'
import {
  CORE_MEMORY_DOC_IDS,
  MEMORY_DOCS_STORAGE_KEY,
  createDailyMemoryDoc,
  getTodayDailyDocId,
  normalizeMemoryDocs,
  scoreMemoryDoc,
  type MemoryDoc,
  type MemoryDocMap,
} from '../../shared/memoryDocs'

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  return tab?.id
}

function readMemoryLines(profile: unknown): string[] {
  if (typeof profile === 'string') {
    return profile.split('\n').map((line) => line.trim()).filter(Boolean)
  }

  if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
    const notes = (profile as { notes?: unknown }).notes
    if (Array.isArray(notes)) {
      return notes.filter((note): note is string => typeof note === 'string').map((note) => note.trim()).filter(Boolean)
    }
  }

  return []
}

function writeMemoryProfile(existingProfile: unknown, lines: string[]): string | Record<string, unknown> {
  if (existingProfile && typeof existingProfile === 'object' && !Array.isArray(existingProfile)) {
    return {
      ...(existingProfile as Record<string, unknown>),
      notes: lines,
      lastUpdated: Date.now(),
    }
  }

  return lines.join('\n')
}

async function loadMemoryDocs(): Promise<MemoryDocMap> {
  const storageData = await new Promise<Record<string, unknown>>((resolve) => {
    chrome.storage.local.get(MEMORY_DOCS_STORAGE_KEY, (data) => resolve(data))
  })
  const docs = normalizeMemoryDocs(storageData[MEMORY_DOCS_STORAGE_KEY])
  await saveMemoryDocs(docs)
  return docs
}

async function saveMemoryDocs(docs: MemoryDocMap): Promise<void> {
  await new Promise<void>((resolve) => {
    chrome.storage.local.set({ [MEMORY_DOCS_STORAGE_KEY]: docs }, () => resolve())
  })
}

function appendToDoc(doc: MemoryDoc, text: string): MemoryDoc {
  const trimmed = text.trim()
  if (!trimmed) return doc
  const separator = doc.content.endsWith('\n') ? '' : '\n'
  return {
    ...doc,
    content: `${doc.content}${separator}${trimmed}\n`,
    updatedAt: Date.now(),
  }
}

function factToMemoryLine(fact: string, category: string): string {
  const timestamp = new Date().toISOString().split('T')[0]
  return `- [${timestamp}] [${category.toUpperCase()}] ${fact.trim()}`
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
      name: 'read_memory_docs',
      description: 'Read Harbor Markdown memory documents such as SOUL.md, AGENTS.md, USER.md, MEMORY.md, TOOLS.md, or daily logs. Use this before answering questions about stored preferences, durable facts, or operational rules.',
      parameters: {
        type: 'object',
        properties: {
          docId: {
            type: 'string',
            description: 'Optional document ID to read, for example USER.md, MEMORY.md, SOUL.md, AGENTS.md, TOOLS.md, or DAILY/YYYY-MM-DD.md. If omitted, returns the core docs plus today.',
          },
        },
      },
    },
    async execute(input) {
      try {
        const { docId } = input as { docId?: string }
        const docs = await loadMemoryDocs()

        if (docId) {
          const doc = docs[docId]
          if (!doc) return error(`Memory document not found: ${docId}`)
          return ok({ doc })
        }

        const todayId = getTodayDailyDocId()
        const ids = [...CORE_MEMORY_DOC_IDS, todayId].filter((id, index, arr) => arr.indexOf(id) === index)
        const selected = ids.map((id) => docs[id]).filter(Boolean)
        return ok({
          docs: selected,
          availableDocIds: Object.keys(docs).sort(),
        })
      } catch (err) {
        return error(`Failed to read memory docs: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  {
    definition: {
      name: 'search_memory_docs',
      description: 'Search Harbor Markdown memory documents with keyword scoring. Use this when the user asks about something possibly remembered from earlier sessions.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query. Use concrete keywords from the user request.',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of matching documents to return. Defaults to 5.',
          },
        },
        required: ['query'],
      },
    },
    async execute(input) {
      try {
        const { query, limit = 5 } = input as { query: string; limit?: number }
        if (!query || !query.trim()) return error('query is required')

        const docs = await loadMemoryDocs()
        const matches = Object.values(docs)
          .map((doc) => ({ doc, score: scoreMemoryDoc(doc, query) }))
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, Math.max(1, Math.min(20, limit)))
          .map(({ doc, score }) => ({
            id: doc.id,
            title: doc.title,
            description: doc.description,
            updatedAt: doc.updatedAt,
            score,
            preview: doc.content.slice(0, 1200),
          }))

        return ok({ query, matches, count: matches.length })
      } catch (err) {
        return error(`Failed to search memory docs: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  {
    definition: {
      name: 'update_memory_doc',
      description: 'Create, replace, or append to a Harbor Markdown memory document. Use this for durable user facts, user preferences, operational rules, tool notes, and evolving agent behavior.',
      parameters: {
        type: 'object',
        properties: {
          docId: {
            type: 'string',
            description: 'Document ID, for example USER.md, MEMORY.md, SOUL.md, AGENTS.md, TOOLS.md, or DAILY/YYYY-MM-DD.md.',
          },
          content: {
            type: 'string',
            description: 'Markdown content to write or append.',
          },
          mode: {
            type: 'string',
            enum: ['replace', 'append'],
            description: 'replace overwrites the whole document. append adds content to the end. Defaults to append.',
          },
          description: {
            type: 'string',
            description: 'Optional document description when creating a new document.',
          },
        },
        required: ['docId', 'content'],
      },
    },
    async execute(input) {
      try {
        const { docId, content, mode = 'append', description } = input as {
          docId: string
          content: string
          mode?: 'replace' | 'append'
          description?: string
        }
        if (!docId || !docId.trim()) return error('docId is required')
        if (!content || !content.trim()) return error('content is required')
        if (mode !== 'replace' && mode !== 'append') return error('mode must be replace or append')

        const docs = await loadMemoryDocs()
        const existing = docs[docId]
        const now = Date.now()
        const nextDoc: MemoryDoc = existing
          ? mode === 'replace'
            ? { ...existing, content, updatedAt: now }
            : appendToDoc(existing, content)
          : {
              id: docId as MemoryDoc['id'],
              title: docId,
              description: description ?? '',
              content: mode === 'replace' ? content : `${content.trim()}\n`,
              updatedAt: now,
            }

        docs[docId] = nextDoc
        await saveMemoryDocs(docs)
        return ok({ updated: true, doc: nextDoc })
      } catch (err) {
        return error(`Failed to update memory doc: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
  },

  {
    definition: {
      name: 'append_daily_memory_note',
      description: 'Append a raw observation or session note to today\'s daily memory log. Use for facts that may be useful later but still need distillation.',
      parameters: {
        type: 'object',
        properties: {
          note: {
            type: 'string',
            description: 'Short Markdown note to append to today\'s daily log.',
          },
        },
        required: ['note'],
      },
    },
    async execute(input) {
      try {
        const { note } = input as { note: string }
        if (!note || !note.trim()) return error('note is required')

        const docs = await loadMemoryDocs()
        const todayId = getTodayDailyDocId()
        const today = docs[todayId] ?? createDailyMemoryDoc()
        const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        docs[todayId] = appendToDoc(today, `- ${timestamp}: ${note.trim()}`)
        await saveMemoryDocs(docs)

        return ok({ appended: true, docId: todayId })
      } catch (err) {
        return error(`Failed to append daily note: ${err instanceof Error ? err.message : String(err)}`)
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

        let profileLines = readMemoryLines(storageData.harbor_user_profile)

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

        const docs = await loadMemoryDocs()
        const memoryDoc = docs['MEMORY.md']
        const userDoc = docs['USER.md']
        const dailyId = getTodayDailyDocId()
        const dailyDoc = docs[dailyId] ?? createDailyMemoryDoc()
        const memoryLine = factToMemoryLine(fact, category)
        const shouldAddToMemoryDoc = !memoryDoc.content.toLowerCase().includes(fact.toLowerCase())
        if (shouldAddToMemoryDoc) {
          docs['MEMORY.md'] = appendToDoc(memoryDoc, memoryLine)
        }
        if (category === 'personal' || category === 'preferences' || category === 'work' || category === 'goals') {
          docs['USER.md'] = appendToDoc(userDoc, memoryLine)
        }
        docs[dailyId] = appendToDoc(dailyDoc, memoryLine)

        // Save back to storage
        await new Promise<void>((resolve) => {
          chrome.storage.local.set({
            harbor_user_profile: writeMemoryProfile(storageData.harbor_user_profile, profileLines),
            [MEMORY_DOCS_STORAGE_KEY]: docs,
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

        const profileLines = readMemoryLines(storageData.harbor_user_profile)

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

        let profileLines = readMemoryLines(storageData.harbor_user_profile)

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
            harbor_user_profile: writeMemoryProfile(storageData.harbor_user_profile, profileLines),
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

        let profileLines = readMemoryLines(storageData.harbor_user_profile)
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
            harbor_user_profile: writeMemoryProfile(storageData.harbor_user_profile, profileLines),
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
