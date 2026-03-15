import type { ToolHandler } from '../agent/types'
import { ok, error } from './response'

function formatBookmark(node: chrome.bookmarks.BookmarkTreeNode): Record<string, unknown> {
  return {
    id: node.id,
    title: node.title,
    url: node.url,
    parentId: node.parentId,
    index: node.index,
    dateAdded: node.dateAdded,
    isFolder: !node.url,
    children: node.children?.length,
  }
}

export const bookmarkTools: ToolHandler[] = [
  {
    definition: {
      name: 'get_bookmarks',
      description: 'Get bookmarks. Returns the full bookmark tree if no ID specified.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Bookmark or folder ID to retrieve. Defaults to root.' },
        },
      },
    },
    async execute(input) {
      try {
        const { id } = input as { id?: string }
        const nodes = id ? await chrome.bookmarks.get(id) : await chrome.bookmarks.getTree()

        function flattenTree(nodes: chrome.bookmarks.BookmarkTreeNode[]): Record<string, unknown>[] {
          const result: Record<string, unknown>[] = []
          for (const node of nodes) {
            result.push(formatBookmark(node))
            if (node.children) {
              result.push(...flattenTree(node.children))
            }
          }
          return result
        }

        return ok({
          bookmarks: flattenTree(nodes),
          total: flattenTree(nodes).length,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'search_bookmarks',
      description: 'Search bookmarks by title or URL.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Text to search in bookmark titles and URLs.' },
        },
        required: ['query'],
      },
    },
    async execute(input) {
      try {
        const { query } = input as { query: string }
        const results = await chrome.bookmarks.search(query)
        return ok({
          bookmarks: results.map(formatBookmark),
          total: results.length,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'add_bookmark',
      description: 'Add a new bookmark.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Bookmark title.' },
          url: { type: 'string', description: 'URL to bookmark.' },
          parentId: { type: 'string', description: 'Parent folder ID. Defaults to Bookmarks Bar.' },
        },
        required: ['title', 'url'],
      },
    },
    async execute(input) {
      try {
        const { title, url, parentId } = input as { title: string; url: string; parentId?: string }
        const bookmark = await chrome.bookmarks.create({ title, url, parentId })
        return ok(formatBookmark(bookmark))
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'delete_bookmark',
      description: 'Delete a bookmark by ID.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Bookmark ID to delete.' },
        },
        required: ['id'],
      },
    },
    async execute(input) {
      try {
        const { id } = input as { id: string }
        await chrome.bookmarks.remove(id)
        return ok({ deleted: true, id })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'create_bookmark_folder',
      description: 'Create a new bookmark folder.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Folder name.' },
          parentId: { type: 'string', description: 'Parent folder ID.' },
        },
        required: ['title'],
      },
    },
    async execute(input) {
      try {
        const { title, parentId } = input as { title: string; parentId?: string }
        const folder = await chrome.bookmarks.create({ title, parentId })
        return ok(formatBookmark(folder))
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'move_bookmark',
      description: 'Move a bookmark to a different folder.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Bookmark ID to move.' },
          parentId: { type: 'string', description: 'Destination folder ID.' },
          index: { type: 'number', description: 'Position within the folder.' },
        },
        required: ['id'],
      },
    },
    async execute(input) {
      try {
        const { id, parentId, index } = input as { id: string; parentId?: string; index?: number }
        const bookmark = await chrome.bookmarks.move(id, { parentId, index })
        return ok(formatBookmark(bookmark))
      } catch (err) {
        return error(String(err))
      }
    },
  },
]
