import type { ToolHandler } from '../agent/types'
import { ok, error } from './response'

function formatHistoryItem(item: chrome.history.HistoryItem): Record<string, unknown> {
  return {
    id: item.id,
    url: item.url,
    title: item.title,
    lastVisit: item.lastVisitTime ? new Date(item.lastVisitTime).toISOString() : null,
    visitCount: item.visitCount,
  }
}

export const historyTools: ToolHandler[] = [
  {
    definition: {
      name: 'search_history',
      description: 'Search browser history.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Text to search in history URLs and titles.' },
          maxResults: { type: 'number', description: 'Maximum results. Default: 20.', minimum: 1, maximum: 100 },
          startTime: { type: 'number', description: 'Start time in milliseconds since epoch.' },
          endTime: { type: 'number', description: 'End time in milliseconds since epoch.' },
        },
        required: ['query'],
      },
    },
    async execute(input) {
      try {
        const { query, maxResults = 20, startTime, endTime } = input as {
          query: string
          maxResults?: number
          startTime?: number
          endTime?: number
        }

        const results = await chrome.history.search({
          text: query,
          maxResults,
          startTime,
          endTime,
        })

        return ok({
          history: results.map(formatHistoryItem),
          total: results.length,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'get_recent_history',
      description: 'Get recently visited pages.',
      parameters: {
        type: 'object',
        properties: {
          maxResults: { type: 'number', description: 'Maximum results. Default: 20.', minimum: 1, maximum: 100 },
          daysBack: { type: 'number', description: 'How many days back to look. Default: 7.', minimum: 1 },
        },
      },
    },
    async execute(input) {
      try {
        const { maxResults = 20, daysBack = 7 } = input as { maxResults?: number; daysBack?: number }
        const startTime = Date.now() - daysBack * 24 * 60 * 60 * 1000

        const results = await chrome.history.search({
          text: '',
          maxResults,
          startTime,
        })

        return ok({
          history: results.map(formatHistoryItem),
          total: results.length,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'delete_history_url',
      description: 'Delete all history entries for a specific URL.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to remove from history.' },
        },
        required: ['url'],
      },
    },
    async execute(input) {
      try {
        const { url } = input as { url: string }
        await chrome.history.deleteUrl({ url })
        return ok({ deleted: true, url })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'delete_history_range',
      description: 'Delete browser history within a time range.',
      parameters: {
        type: 'object',
        properties: {
          startTime: { type: 'number', description: 'Start time in milliseconds since epoch.' },
          endTime: { type: 'number', description: 'End time in milliseconds since epoch.' },
        },
        required: ['startTime', 'endTime'],
      },
    },
    async execute(input) {
      try {
        const { startTime, endTime } = input as { startTime: number; endTime: number }
        await chrome.history.deleteRange({ startTime, endTime })
        return ok({ deleted: true, startTime, endTime })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'get_visits',
      description: 'Get detailed visit information for a specific URL.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to get visits for.' },
        },
        required: ['url'],
      },
    },
    async execute(input) {
      try {
        const { url } = input as { url: string }
        const visits = await chrome.history.getVisits({ url })
        return ok({
          url,
          visits: visits.map((v) => ({
            id: v.id,
            visitId: v.visitId,
            visitTime: v.visitTime ? new Date(v.visitTime).toISOString() : null,
            transition: v.transition,
          })),
          total: visits.length,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },
]
