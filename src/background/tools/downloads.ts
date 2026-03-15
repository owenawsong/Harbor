import type { ToolHandler } from '../agent/types'
import { ok, error } from './response'

export const downloadTools: ToolHandler[] = [
  {
    definition: {
      name: 'download_file',
      description: 'Download a file from a URL.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL of the file to download.' },
          filename: { type: 'string', description: 'Filename to save as. Optional.' },
          saveAs: { type: 'boolean', description: 'Show Save As dialog. Default: false.' },
        },
        required: ['url'],
      },
    },
    async execute(input) {
      try {
        const { url, filename, saveAs = false } = input as { url: string; filename?: string; saveAs?: boolean }
        const downloadId = await chrome.downloads.download({ url, filename, saveAs })
        return ok({ downloadId, url, filename })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'list_downloads',
      description: 'List recent downloads.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max downloads to return. Default: 20.', minimum: 1, maximum: 100 },
          query: { type: 'string', description: 'Filter by filename or URL.' },
        },
      },
    },
    async execute(input) {
      try {
        const { limit = 20, query } = input as { limit?: number; query?: string }
        const downloads = await chrome.downloads.search({
          limit,
          filenameRegex: query,
          orderBy: ['-startTime'],
        })

        return ok({
          downloads: downloads.map((d) => ({
            id: d.id,
            filename: d.filename,
            url: d.url,
            state: d.state,
            bytesReceived: d.bytesReceived,
            totalBytes: d.totalBytes,
            startTime: d.startTime,
          })),
          total: downloads.length,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'save_content_to_file',
      description: 'Save text content to a file on the user\'s computer.',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Text content to save.' },
          filename: { type: 'string', description: 'Filename including extension (e.g., "notes.txt", "data.json").' },
          mimeType: { type: 'string', description: 'MIME type. Default: "text/plain".' },
        },
        required: ['content', 'filename'],
      },
    },
    async execute(input) {
      try {
        const { content, filename, mimeType = 'text/plain' } = input as {
          content: string
          filename: string
          mimeType?: string
        }

        // Create a blob URL
        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)

        const downloadId = await chrome.downloads.download({ url, filename })

        // Clean up blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 60000)

        return ok({ downloadId, filename, size: content.length })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'open_file',
      description: 'Open a downloaded file.',
      parameters: {
        type: 'object',
        properties: {
          downloadId: { type: 'number', description: 'Download ID to open.' },
        },
        required: ['downloadId'],
      },
    },
    async execute(input) {
      try {
        const { downloadId } = input as { downloadId: number }
        await chrome.downloads.open(downloadId)
        return ok({ opened: true, downloadId })
      } catch (err) {
        return error(String(err))
      }
    },
  },
]
