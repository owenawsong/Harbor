import type { ToolHandler } from '../agent/types'
import { ok, error, formatTabInfo, formatWindowInfo } from './response'

export const windowTools: ToolHandler[] = [
  {
    definition: {
      name: 'list_windows',
      description: 'List all open browser windows.',
      parameters: {
        type: 'object',
        properties: {
          includeTabs: { type: 'boolean', description: 'Include tab info in each window. Default: false.' },
        },
      },
    },
    async execute(input) {
      try {
        const { includeTabs = false } = input as { includeTabs?: boolean }
        const windows = await chrome.windows.getAll({ populate: includeTabs })
        return ok({
          windows: windows.map((w) => ({
            ...formatWindowInfo(w),
            tabs: includeTabs ? w.tabs?.map(formatTabInfo) : undefined,
          })),
          total: windows.length,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'get_active_window',
      description: 'Get information about the currently focused window.',
      parameters: {
        type: 'object',
        properties: {
          includeTabs: { type: 'boolean', description: 'Include tabs. Default: true.' },
        },
      },
    },
    async execute(input) {
      try {
        const { includeTabs = true } = input as { includeTabs?: boolean }
        const win = await chrome.windows.getCurrent({ populate: includeTabs })
        return ok({
          ...formatWindowInfo(win),
          tabs: includeTabs ? win.tabs?.map(formatTabInfo) : undefined,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'new_window',
      description: 'Open a new browser window.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to open in the new window.' },
          incognito: { type: 'boolean', description: 'Open in incognito mode. Default: false.' },
          type: {
            type: 'string',
            enum: ['normal', 'popup'],
            description: 'Window type. Default: normal.',
          },
          width: { type: 'number', description: 'Window width in pixels.' },
          height: { type: 'number', description: 'Window height in pixels.' },
        },
      },
    },
    async execute(input) {
      try {
        const { url, incognito = false, type = 'normal', width, height } = input as {
          url?: string
          incognito?: boolean
          type?: 'normal' | 'popup'
          width?: number
          height?: number
        }

        const win = await chrome.windows.create({
          url,
          incognito,
          type,
          width,
          height,
        })

        return ok(formatWindowInfo(win!))
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'close_window',
      description: 'Close a browser window.',
      parameters: {
        type: 'object',
        properties: {
          windowId: { type: 'number', description: 'Window ID to close.' },
        },
        required: ['windowId'],
      },
    },
    async execute(input) {
      try {
        const { windowId } = input as { windowId: number }
        await chrome.windows.remove(windowId)
        return ok({ closed: true, windowId })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'focus_window',
      description: 'Focus (bring to front) a browser window.',
      parameters: {
        type: 'object',
        properties: {
          windowId: { type: 'number', description: 'Window ID to focus.' },
        },
        required: ['windowId'],
      },
    },
    async execute(input) {
      try {
        const { windowId } = input as { windowId: number }
        await chrome.windows.update(windowId, { focused: true })
        return ok({ focused: true, windowId })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'resize_window',
      description: 'Resize or move a browser window.',
      parameters: {
        type: 'object',
        properties: {
          windowId: { type: 'number', description: 'Window ID to resize.' },
          width: { type: 'number', description: 'New width in pixels.' },
          height: { type: 'number', description: 'New height in pixels.' },
          left: { type: 'number', description: 'New left position in pixels.' },
          top: { type: 'number', description: 'New top position in pixels.' },
          state: {
            type: 'string',
            enum: ['normal', 'minimized', 'maximized', 'fullscreen'],
            description: 'Window state.',
          },
        },
        required: ['windowId'],
      },
    },
    async execute(input) {
      try {
        const { windowId, width, height, left, top, state } = input as {
          windowId: number
          width?: number
          height?: number
          left?: number
          top?: number
          state?: chrome.windows.ValidStates
        }

        const win = await chrome.windows.update(windowId, { width, height, left, top, state })
        return ok(formatWindowInfo(win))
      } catch (err) {
        return error(String(err))
      }
    },
  },
]

export const tabGroupTools: ToolHandler[] = [
  {
    definition: {
      name: 'list_tab_groups',
      description: 'List all tab groups in the current window.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
    async execute() {
      try {
        const groups = await chrome.tabGroups.query({})
        return ok({
          groups: groups.map((g) => ({
            id: g.id,
            title: g.title,
            color: g.color,
            collapsed: g.collapsed,
            windowId: g.windowId,
          })),
          total: groups.length,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'create_tab_group',
      description: 'Create a new tab group with specified tabs.',
      parameters: {
        type: 'object',
        properties: {
          tabIds: {
            type: 'array',
            items: { type: 'number' },
            description: 'Tab IDs to group.',
          },
          title: { type: 'string', description: 'Group name.' },
          color: {
            type: 'string',
            enum: ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'],
            description: 'Group color.',
          },
        },
        required: ['tabIds'],
      },
    },
    async execute(input) {
      try {
        const { tabIds, title, color } = input as {
          tabIds: number[]
          title?: string
          color?: chrome.tabGroups.ColorEnum
        }

        const groupId = await chrome.tabs.group({ tabIds })
        if (title || color) {
          await chrome.tabGroups.update(groupId, { title, color })
        }

        const group = await chrome.tabGroups.get(groupId)
        return ok({
          id: group.id,
          title: group.title,
          color: group.color,
          tabIds,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'update_tab_group',
      description: 'Update a tab group\'s title, color, or collapsed state.',
      parameters: {
        type: 'object',
        properties: {
          groupId: { type: 'number', description: 'Tab group ID.' },
          title: { type: 'string', description: 'New group title.' },
          color: {
            type: 'string',
            enum: ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'],
          },
          collapsed: { type: 'boolean', description: 'Collapse or expand the group.' },
        },
        required: ['groupId'],
      },
    },
    async execute(input) {
      try {
        const { groupId, title, color, collapsed } = input as {
          groupId: number
          title?: string
          color?: chrome.tabGroups.ColorEnum
          collapsed?: boolean
        }

        const group = await chrome.tabGroups.update(groupId, { title, color, collapsed })
        return ok({
          id: group.id,
          title: group.title,
          color: group.color,
          collapsed: group.collapsed,
        })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'move_tab_to_group',
      description: 'Move a tab into a tab group.',
      parameters: {
        type: 'object',
        properties: {
          tabId: { type: 'number', description: 'Tab ID to move.' },
          groupId: { type: 'number', description: 'Target group ID.' },
        },
        required: ['tabId', 'groupId'],
      },
    },
    async execute(input) {
      try {
        const { tabId, groupId } = input as { tabId: number; groupId: number }
        await chrome.tabs.group({ tabIds: [tabId], groupId })
        return ok({ moved: true, tabId, groupId })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'ungroup_tabs',
      description: 'Remove tabs from their group.',
      parameters: {
        type: 'object',
        properties: {
          tabIds: {
            type: 'array',
            items: { type: 'number' },
            description: 'Tab IDs to ungroup.',
          },
        },
        required: ['tabIds'],
      },
    },
    async execute(input) {
      try {
        const { tabIds } = input as { tabIds: number[] }
        await chrome.tabs.ungroup(tabIds)
        return ok({ ungrouped: true, tabIds })
      } catch (err) {
        return error(String(err))
      }
    },
  },
]
