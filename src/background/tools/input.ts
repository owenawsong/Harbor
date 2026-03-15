import type { ToolHandler } from '../agent/types'
import { ok, error, sendToContentScript } from './response'

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab?.id
}

export const inputTools: ToolHandler[] = [
  {
    definition: {
      name: 'click',
      description:
        'Click on a page element by its ID from a snapshot. Use take_snapshot first to get element IDs.',
      parameters: {
        type: 'object',
        properties: {
          elementId: { type: 'number', description: 'Element ID from take_snapshot.' },
          selector: { type: 'string', description: 'CSS selector (alternative to elementId).' },
          button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Mouse button. Default: left.' },
          clickCount: { type: 'number', description: 'Number of clicks (1=single, 2=double). Default: 1.' },
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
      },
    },
    async execute(input) {
      try {
        let { elementId, selector, button = 'left', clickCount = 1, tabId } = input as {
          elementId?: number
          selector?: string
          button?: string
          clickCount?: number
          tabId?: number
        }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, {
          type: 'harbor_click',
          elementId,
          selector,
          button,
          clickCount,
        })
        if (!result.success) return error(result.error ?? 'Click failed')
        return ok({ clicked: true })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'click_at',
      description: 'Click at specific page coordinates.',
      parameters: {
        type: 'object',
        properties: {
          x: { type: 'number', description: 'X coordinate in pixels.' },
          y: { type: 'number', description: 'Y coordinate in pixels.' },
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
        required: ['x', 'y'],
      },
    },
    async execute(input) {
      try {
        let { x, y, tabId } = input as { x: number; y: number; tabId?: number }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, { type: 'harbor_click_at', x, y })
        if (!result.success) return error(result.error ?? 'Click failed')
        return ok({ clicked: true, x, y })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'fill',
      description: 'Type text into an input field or textarea.',
      parameters: {
        type: 'object',
        properties: {
          elementId: { type: 'number', description: 'Element ID from take_snapshot.' },
          selector: { type: 'string', description: 'CSS selector (alternative to elementId).' },
          text: { type: 'string', description: 'Text to type into the field.' },
          clearFirst: { type: 'boolean', description: 'Clear existing text before typing. Default: true.' },
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
        required: ['text'],
      },
    },
    async execute(input) {
      try {
        let { elementId, selector, text, clearFirst = true, tabId } = input as {
          elementId?: number
          selector?: string
          text: string
          clearFirst?: boolean
          tabId?: number
        }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, {
          type: 'harbor_fill',
          elementId,
          selector,
          text,
          clearFirst,
        })
        if (!result.success) return error(result.error ?? 'Fill failed')
        return ok({ filled: true, text })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'clear',
      description: 'Clear all text from an input field.',
      parameters: {
        type: 'object',
        properties: {
          elementId: { type: 'number', description: 'Element ID from take_snapshot.' },
          selector: { type: 'string', description: 'CSS selector (alternative to elementId).' },
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
      },
    },
    async execute(input) {
      try {
        let { elementId, selector, tabId } = input as { elementId?: number; selector?: string; tabId?: number }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, { type: 'harbor_clear', elementId, selector })
        if (!result.success) return error(result.error ?? 'Clear failed')
        return ok({ cleared: true })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'press_key',
      description:
        'Press a keyboard key or key combination. Examples: "Enter", "Tab", "Escape", "Control+A", "Control+C", "ArrowDown".',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Key or key combination to press.' },
          elementId: { type: 'number', description: 'Element to focus before pressing. Optional.' },
          selector: { type: 'string', description: 'CSS selector (alternative to elementId).' },
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
        required: ['key'],
      },
    },
    async execute(input) {
      try {
        let { key, elementId, selector, tabId } = input as {
          key: string
          elementId?: number
          selector?: string
          tabId?: number
        }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, {
          type: 'harbor_press_key',
          key,
          elementId,
          selector,
        })
        if (!result.success) return error(result.error ?? 'Key press failed')
        return ok({ pressed: true, key })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'scroll',
      description: 'Scroll the page or a specific element.',
      parameters: {
        type: 'object',
        properties: {
          direction: {
            type: 'string',
            enum: ['up', 'down', 'left', 'right'],
            description: 'Direction to scroll.',
          },
          amount: { type: 'number', description: 'Pixels to scroll. Default: 300.' },
          elementId: { type: 'number', description: 'Element to scroll. Defaults to whole page.' },
          selector: { type: 'string', description: 'CSS selector (alternative to elementId).' },
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
        required: ['direction'],
      },
    },
    async execute(input) {
      try {
        let { direction, amount = 300, elementId, selector, tabId } = input as {
          direction: string
          amount?: number
          elementId?: number
          selector?: string
          tabId?: number
        }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, {
          type: 'harbor_scroll',
          direction,
          amount,
          elementId,
          selector,
        })
        if (!result.success) return error(result.error ?? 'Scroll failed')
        return ok({ scrolled: true, direction, amount })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'hover',
      description: 'Hover the mouse over an element.',
      parameters: {
        type: 'object',
        properties: {
          elementId: { type: 'number', description: 'Element ID from take_snapshot.' },
          selector: { type: 'string', description: 'CSS selector (alternative to elementId).' },
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
      },
    },
    async execute(input) {
      try {
        let { elementId, selector, tabId } = input as { elementId?: number; selector?: string; tabId?: number }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, { type: 'harbor_hover', elementId, selector })
        if (!result.success) return error(result.error ?? 'Hover failed')
        return ok({ hovered: true })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'focus',
      description: 'Focus on an element (e.g., to receive keyboard input).',
      parameters: {
        type: 'object',
        properties: {
          elementId: { type: 'number', description: 'Element ID from take_snapshot.' },
          selector: { type: 'string', description: 'CSS selector (alternative to elementId).' },
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
      },
    },
    async execute(input) {
      try {
        let { elementId, selector, tabId } = input as { elementId?: number; selector?: string; tabId?: number }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, { type: 'harbor_focus', elementId, selector })
        if (!result.success) return error(result.error ?? 'Focus failed')
        return ok({ focused: true })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'select_option',
      description: 'Select an option from a dropdown (<select> element).',
      parameters: {
        type: 'object',
        properties: {
          elementId: { type: 'number', description: 'Element ID of the select element.' },
          selector: { type: 'string', description: 'CSS selector (alternative to elementId).' },
          value: { type: 'string', description: 'Option value attribute to select.' },
          label: { type: 'string', description: 'Option visible text to select (alternative to value).' },
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
      },
    },
    async execute(input) {
      try {
        let { elementId, selector, value, label, tabId } = input as {
          elementId?: number
          selector?: string
          value?: string
          label?: string
          tabId?: number
        }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, {
          type: 'harbor_select_option',
          elementId,
          selector,
          value,
          label,
        })
        if (!result.success) return error(result.error ?? 'Select failed')
        return ok(result.data)
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'check',
      description: 'Check or uncheck a checkbox or radio button.',
      parameters: {
        type: 'object',
        properties: {
          elementId: { type: 'number', description: 'Element ID from take_snapshot.' },
          selector: { type: 'string', description: 'CSS selector (alternative to elementId).' },
          checked: { type: 'boolean', description: 'True to check, false to uncheck. Default: true.' },
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
      },
    },
    async execute(input) {
      try {
        let { elementId, selector, checked = true, tabId } = input as {
          elementId?: number
          selector?: string
          checked?: boolean
          tabId?: number
        }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, {
          type: 'harbor_check',
          elementId,
          selector,
          checked,
        })
        if (!result.success) return error(result.error ?? 'Check failed')
        return ok(result.data)
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'handle_dialog',
      description: 'Handle a JavaScript dialog (alert, confirm, prompt).',
      parameters: {
        type: 'object',
        properties: {
          accept: { type: 'boolean', description: 'Accept (OK) or dismiss (Cancel) the dialog.' },
          text: { type: 'string', description: 'Text to enter for prompt dialogs.' },
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
        required: ['accept'],
      },
    },
    async execute(input) {
      try {
        let { accept, text, tabId } = input as { accept: boolean; text?: string; tabId?: number }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, { type: 'harbor_handle_dialog', accept, text })
        if (!result.success) return error(result.error ?? 'Handle dialog failed')
        return ok({ handled: true, accepted: accept })
      } catch (err) {
        return error(String(err))
      }
    },
  },

  {
    definition: {
      name: 'drag',
      description: 'Drag an element to another element or coordinates.',
      parameters: {
        type: 'object',
        properties: {
          fromId: { type: 'number', description: 'Source element ID from take_snapshot.' },
          fromSelector: { type: 'string', description: 'Source CSS selector.' },
          toId: { type: 'number', description: 'Target element ID from take_snapshot.' },
          toSelector: { type: 'string', description: 'Target CSS selector.' },
          toX: { type: 'number', description: 'Target X coordinate (alternative to toId).' },
          toY: { type: 'number', description: 'Target Y coordinate (alternative to toId).' },
          tabId: { type: 'number', description: 'Tab ID. Defaults to active tab.' },
        },
      },
    },
    async execute(input) {
      try {
        let { tabId, ...rest } = input as { tabId?: number; [key: string]: unknown }
        if (!tabId) tabId = await getActiveTabId()
        if (!tabId) return error('No active tab')

        const result = await sendToContentScript(tabId, { type: 'harbor_drag', ...rest })
        if (!result.success) return error(result.error ?? 'Drag failed')
        return ok({ dragged: true })
      } catch (err) {
        return error(String(err))
      }
    },
  },
]
