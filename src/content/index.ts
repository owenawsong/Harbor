/**
 * Harbor Content Script
 * Injected into all pages. Handles DOM interaction on behalf of the agent.
 * Communicates with the background service worker via chrome.runtime messages.
 *
 * NOTE: This file must NOT import from any shared modules. Content scripts
 * cannot be ES modules (no dynamic imports), so all dependencies must be
 * defined inline here.
 */

// Inlined from shared/constants.ts — do NOT import; content scripts are classic scripts
const HARBOR_ELEMENT_ATTR = 'data-harbor-id'

// ─── Element ID Registry ──────────────────────────────────────────────────────

let elementCounter = 0
const elementMap = new Map<number, Element>()

function resetElements() {
  elementCounter = 0
  elementMap.clear()
  document.querySelectorAll(`[${HARBOR_ELEMENT_ATTR}]`).forEach((el) => {
    el.removeAttribute(HARBOR_ELEMENT_ATTR)
  })
}

function assignId(el: Element): number {
  const existing = el.getAttribute(HARBOR_ELEMENT_ATTR)
  if (existing) return parseInt(existing)
  const id = ++elementCounter
  el.setAttribute(HARBOR_ELEMENT_ATTR, String(id))
  elementMap.set(id, el)
  return id
}

function getElementById(id: number): Element | null {
  return elementMap.get(id) ?? document.querySelector(`[${HARBOR_ELEMENT_ATTR}="${id}"]`)
}

// ─── Snapshot Logic ───────────────────────────────────────────────────────────

const INTERACTIVE_TAGS = new Set([
  'a', 'button', 'input', 'select', 'textarea', 'label',
  'details', 'summary', 'video', 'audio', 'canvas',
])

const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'checkbox', 'radio', 'textbox', 'combobox',
  'listbox', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
  'option', 'slider', 'spinbutton', 'switch', 'tab', 'treeitem',
  'searchbox', 'scrollbar', 'separator',
])

function getImplicitRole(tag: string, type?: string): string {
  const map: Record<string, string> = {
    a: 'link',
    button: 'button',
    input: type === 'checkbox' ? 'checkbox' : type === 'radio' ? 'radio' : 'textbox',
    select: 'combobox',
    textarea: 'textbox',
    h1: 'heading', h2: 'heading', h3: 'heading', h4: 'heading', h5: 'heading', h6: 'heading',
    img: 'img',
    nav: 'navigation',
    main: 'main',
    footer: 'contentinfo',
    header: 'banner',
    form: 'form',
    table: 'table',
    li: 'listitem',
    ul: 'list',
    ol: 'list',
  }
  return map[tag] ?? ''
}

function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false
  const style = window.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false
  return true
}

function isInteractiveElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase()
  if (INTERACTIVE_TAGS.has(tag)) return true
  const role = el.getAttribute('role') ?? ''
  if (INTERACTIVE_ROLES.has(role)) return true
  // Elements with click handlers or tabindex
  if (el.getAttribute('tabindex') !== null && el.getAttribute('tabindex') !== '-1') return true
  if (el.getAttribute('onclick') !== null) return true
  if (el.getAttribute('contenteditable') === 'true') return true
  return false
}

function getElementText(el: Element): string {
  const label = el.getAttribute('aria-label')
  if (label) return label.trim()

  const labelledBy = el.getAttribute('aria-labelledby')
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy)
    if (labelEl) return labelEl.textContent?.trim() ?? ''
  }

  if (el instanceof HTMLInputElement) {
    if (el.value) return el.value
    if (el.placeholder) return `[${el.placeholder}]`
  }

  const text = el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 200) ?? ''
  return text
}

function takeSnapshot(): PageSnapshot {
  resetElements()
  const elements: SnapshotElement[] = []
  const lines: string[] = []
  const MAX_ELEMENTS = 500

  function processElement(el: Element) {
    // Stop processing if we've hit the element limit
    if (elements.length >= MAX_ELEMENTS) return

    if (!isVisible(el)) return

    const tag = el.tagName.toLowerCase()
    const type = (el as HTMLInputElement).type?.toLowerCase()
    const role = el.getAttribute('role') ?? getImplicitRole(tag, type)
    const text = getElementText(el)
    const isInteractive = isInteractiveElement(el)
    const href = (el as HTMLAnchorElement).href
    const value = (el as HTMLInputElement).value
    const checked = (el as HTMLInputElement).checked
    const disabled = (el as HTMLInputElement).disabled
    const placeholder = (el as HTMLInputElement).placeholder
    const rect = el.getBoundingClientRect()

    if (isInteractive) {
      const id = assignId(el)
      const element: SnapshotElement = {
        id,
        tag,
        role: role || tag,
        text,
        href: href || undefined,
        type: type || undefined,
        value: value || undefined,
        checked: checked || undefined,
        disabled: disabled || undefined,
        placeholder: placeholder || undefined,
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      }
      elements.push(element)

      // Format line for text representation
      let line = `[${id}] `
      if (role === 'link' || tag === 'a') {
        line += `<link> "${text}"${href ? ` → ${href}` : ''}`
      } else if (role === 'button' || tag === 'button') {
        line += `<button> "${text}"${disabled ? ' (disabled)' : ''}`
      } else if (role === 'textbox' || tag === 'textarea') {
        line += `<input:${type || 'text'}> ${placeholder ? `placeholder="${placeholder}"` : ''}${value ? ` value="${value}"` : ''}`
      } else if (role === 'checkbox') {
        line += `<checkbox> "${text}" ${checked ? '(checked)' : '(unchecked)'}`
      } else if (role === 'radio') {
        line += `<radio> "${text}" ${checked ? '(selected)' : '(unselected)'}`
      } else if (role === 'combobox' || tag === 'select') {
        line += `<select> "${text || value}"`
      } else {
        line += `<${role || tag}> "${text}"`
      }
      lines.push(line)
    }

    // Process children (stop if we've hit the limit)
    if (elements.length < MAX_ELEMENTS) {
      for (const child of el.children) {
        if (elements.length >= MAX_ELEMENTS) break
        processElement(child)
      }
    }
  }

  processElement(document.body)

  const formattedText = [
    `URL: ${document.location.href}`,
    `Title: ${document.title}`,
    ``,
    `=== Interactive Elements ===`,
    ...lines,
  ].join('\n')

  return {
    url: document.location.href,
    title: document.title,
    elements,
    formattedText,
  }
}

// ─── Page Content as Markdown ─────────────────────────────────────────────────

function getPageContent(): string {
  // Remove script/style tags
  const clone = document.body.cloneNode(true) as HTMLElement
  clone.querySelectorAll('script, style, noscript, svg').forEach((el) => el.remove())

  function processNode(node: Node, depth = 0): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent?.trim() ?? ''
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return ''

    const el = node as Element
    const tag = el.tagName.toLowerCase()
    const children = Array.from(el.childNodes)
      .map((child) => processNode(child, depth + 1))
      .filter(Boolean)
      .join(' ')

    switch (tag) {
      case 'h1': return `\n# ${children}\n`
      case 'h2': return `\n## ${children}\n`
      case 'h3': return `\n### ${children}\n`
      case 'h4': return `\n#### ${children}\n`
      case 'h5': return `\n##### ${children}\n`
      case 'h6': return `\n###### ${children}\n`
      case 'p': return `\n${children}\n`
      case 'br': return '\n'
      case 'hr': return '\n---\n'
      case 'strong':
      case 'b': return `**${children}**`
      case 'em':
      case 'i': return `*${children}*`
      case 'code': return `\`${children}\``
      case 'pre': return `\n\`\`\`\n${el.textContent}\n\`\`\`\n`
      case 'blockquote': return `\n> ${children}\n`
      case 'a': {
        const href = el.getAttribute('href')
        return href ? `[${children}](${href})` : children
      }
      case 'img': {
        const alt = el.getAttribute('alt') ?? ''
        const src = el.getAttribute('src') ?? ''
        return `![${alt}](${src})`
      }
      case 'li': return `\n- ${children}`
      case 'ul':
      case 'ol': return `\n${children}\n`
      case 'table': return `\n${children}\n`
      case 'tr': return `${children}\n`
      case 'th': return `| **${children}** `
      case 'td': return `| ${children} `
      case 'thead':
      case 'tbody': return children
      default: return children
    }
  }

  return processNode(clone).replace(/\n{3,}/g, '\n\n').trim()
}

// ─── Element Interaction ──────────────────────────────────────────────────────

function getTargetElement(elementId?: number, selector?: string): Element | null {
  if (elementId !== undefined) return getElementById(elementId)
  if (selector) return document.querySelector(selector)
  return null
}

function simulateClick(el: Element, button: 'left' | 'right' | 'middle' = 'left', clickCount = 1) {
  const rect = el.getBoundingClientRect()
  const x = rect.x + rect.width / 2
  const y = rect.y + rect.height / 2
  const buttonMap = { left: 0, middle: 1, right: 2 }
  const btnNum = buttonMap[button]

  for (let i = 0; i < clickCount; i++) {
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: btnNum, clientX: x, clientY: y }))
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: btnNum, clientX: x, clientY: y }))
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: btnNum, clientX: x, clientY: y, detail: i + 1 }))
  }
}

function fillInput(el: Element, text: string, clearFirst = true) {
  const inputEl = el as HTMLInputElement | HTMLTextAreaElement
  if (clearFirst) {
    inputEl.value = ''
    inputEl.dispatchEvent(new Event('input', { bubbles: true }))
  }

  // Focus the element first
  inputEl.focus()

  // Set value and dispatch events
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    ?? Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(inputEl, inputEl.value + text)
  } else {
    inputEl.value = inputEl.value + text
  }

  inputEl.dispatchEvent(new Event('input', { bubbles: true }))
  inputEl.dispatchEvent(new Event('change', { bubbles: true }))
}

function scrollElement(el: Element | Window, direction: 'up' | 'down' | 'left' | 'right', amount = 300) {
  const scrollMap = {
    up: { top: -amount, left: 0 },
    down: { top: amount, left: 0 },
    left: { top: 0, left: -amount },
    right: { top: 0, left: amount },
  }
  const delta = scrollMap[direction]
  el.scrollBy({ ...delta, behavior: 'smooth' })
}

function getLinks(): Array<{ text: string; href: string; id?: number }> {
  const links: Array<{ text: string; href: string; id?: number }> = []
  const seen = new Set<string>()

  document.querySelectorAll('a[href]').forEach((a) => {
    const href = (a as HTMLAnchorElement).href
    if (!href || seen.has(href)) return
    seen.add(href)
    const text = (a.getAttribute('aria-label') ?? a.textContent ?? '').trim().slice(0, 100)
    links.push({ text, href })
  })

  return links
}

// ─── Message Handler ──────────────────────────────────────────────────────────

interface ContentMessage {
  type: string
  [key: string]: unknown
}

chrome.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse) => {
  ;(async () => {
    try {
      switch (message.type) {
        case 'harbor_ping': {
          sendResponse({ success: true, pong: true })
          break
        }

        case 'harbor_snapshot': {
          const snapshot = takeSnapshot()
          sendResponse({ success: true, data: snapshot })
          break
        }

        case 'harbor_get_content': {
          const content = getPageContent()
          sendResponse({ success: true, data: content })
          break
        }

        case 'harbor_get_links': {
          const links = getLinks()
          sendResponse({ success: true, data: links })
          break
        }

        case 'harbor_click': {
          const { elementId, selector, button, clickCount } = message as {
            type: string
            elementId?: number
            selector?: string
            button?: 'left' | 'right' | 'middle'
            clickCount?: number
          }
          const el = getTargetElement(elementId, selector)
          if (!el) throw new Error(`Element not found: id=${elementId}, selector=${selector}`)
          simulateClick(el, button, clickCount)
          const snapshot = takeSnapshot()
          sendResponse({ success: true, data: { snapshot } })
          break
        }

        case 'harbor_fill': {
          const { elementId, selector, text, clearFirst } = message as {
            type: string
            elementId?: number
            selector?: string
            text: string
            clearFirst?: boolean
          }
          const el = getTargetElement(elementId, selector)
          if (!el) throw new Error(`Element not found: id=${elementId}, selector=${selector}`)
          fillInput(el, text, clearFirst ?? true)
          sendResponse({ success: true, data: { value: (el as HTMLInputElement).value } })
          break
        }

        case 'harbor_clear': {
          const { elementId, selector } = message as { type: string; elementId?: number; selector?: string }
          const el = getTargetElement(elementId, selector)
          if (!el) throw new Error(`Element not found`)
          const inputEl = el as HTMLInputElement
          inputEl.value = ''
          inputEl.dispatchEvent(new Event('input', { bubbles: true }))
          inputEl.dispatchEvent(new Event('change', { bubbles: true }))
          sendResponse({ success: true })
          break
        }

        case 'harbor_hover': {
          const { elementId, selector } = message as { type: string; elementId?: number; selector?: string }
          const el = getTargetElement(elementId, selector)
          if (!el) throw new Error(`Element not found`)
          const rect = el.getBoundingClientRect()
          el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 }))
          el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
          sendResponse({ success: true })
          break
        }

        case 'harbor_focus': {
          const { elementId, selector } = message as { type: string; elementId?: number; selector?: string }
          const el = getTargetElement(elementId, selector)
          if (!el) throw new Error(`Element not found`);
          (el as HTMLElement).focus?.()
          el.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
          sendResponse({ success: true })
          break
        }

        case 'harbor_press_key': {
          const { key, elementId, selector } = message as { type: string; key: string; elementId?: number; selector?: string }
          const el = elementId || selector ? getTargetElement(elementId, selector) : document.activeElement
          const target = el ?? document.body
          const keyOptions = { key, bubbles: true, cancelable: true }
          target.dispatchEvent(new KeyboardEvent('keydown', keyOptions))
          target.dispatchEvent(new KeyboardEvent('keypress', keyOptions))
          target.dispatchEvent(new KeyboardEvent('keyup', keyOptions))
          // Handle Enter/Tab special cases
          if (key === 'Enter' && target instanceof HTMLFormElement) {
            target.submit()
          }
          const snapshot = takeSnapshot()
          sendResponse({ success: true, data: { snapshot } })
          break
        }

        case 'harbor_scroll': {
          const { elementId, selector, direction, amount } = message as {
            type: string
            elementId?: number
            selector?: string
            direction: 'up' | 'down' | 'left' | 'right'
            amount?: number
          }
          if (elementId || selector) {
            const el = getTargetElement(elementId, selector)
            if (!el) throw new Error(`Element not found`)
            scrollElement(el, direction, amount)
          } else {
            scrollElement(window, direction, amount)
          }
          sendResponse({ success: true })
          break
        }

        case 'harbor_select_option': {
          const { elementId, selector, value, label } = message as {
            type: string
            elementId?: number
            selector?: string
            value?: string
            label?: string
          }
          const el = getTargetElement(elementId, selector) as HTMLSelectElement
          if (!el) throw new Error(`Element not found`)

          for (const option of el.options) {
            if (value && option.value === value) {
              option.selected = true
              break
            }
            if (label && option.text === label) {
              option.selected = true
              break
            }
          }
          el.dispatchEvent(new Event('change', { bubbles: true }))
          sendResponse({ success: true, data: { value: el.value } })
          break
        }

        case 'harbor_check': {
          const { elementId, selector, checked } = message as { type: string; elementId?: number; selector?: string; checked: boolean }
          const el = getTargetElement(elementId, selector) as HTMLInputElement
          if (!el) throw new Error(`Element not found`)
          if (el.checked !== checked) {
            el.click()
          }
          sendResponse({ success: true, data: { checked: el.checked } })
          break
        }

        case 'harbor_get_dom': {
          const { selector } = message as { type: string; selector?: string }
          const root = selector ? document.querySelector(selector) : document.body
          const html = root?.outerHTML ?? ''
          sendResponse({ success: true, data: html })
          break
        }

        case 'harbor_search_dom': {
          const { query, limit } = message as { type: string; query: string; limit?: number }
          const max = limit ?? 20
          let elements: Element[] = []

          try {
            elements = Array.from(document.querySelectorAll(query)).slice(0, max)
          } catch {
            // Try text search
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
            const textNodes: Text[] = []
            let node: Node | null
            while ((node = walker.nextNode())) {
              if ((node as Text).textContent?.includes(query)) {
                textNodes.push(node as Text)
                if (textNodes.length >= max) break
              }
            }
            elements = textNodes.map((n) => n.parentElement).filter(Boolean) as Element[]
          }

          const results = elements.map((el) => ({
            tag: el.tagName.toLowerCase(),
            text: el.textContent?.trim().slice(0, 200),
            attributes: Object.fromEntries(
              Array.from(el.attributes).map((a) => [a.name, a.value])
            ),
          }))

          sendResponse({ success: true, data: { results, total: results.length } })
          break
        }

        case 'harbor_evaluate': {
          const { expression } = message as { type: string; expression: string }
          // Execute in page context via eval (already in content script)
          const result = await (async () => {
            try {
              // Use Function constructor to evaluate in a clean scope
              const fn = new Function(`return (async () => { return ${expression} })()`)
              return await fn()
            } catch {
              const fn = new Function(`return (async () => { ${expression} })()`)
              return await fn()
            }
          })()
          sendResponse({ success: true, data: JSON.stringify(result) })
          break
        }

        case 'harbor_handle_dialog': {
          const { accept, text } = message as { type: string; accept: boolean; text?: string }
          // Override dialog handlers
          if (accept) {
            window.alert = () => {}
            window.confirm = () => true
            window.prompt = () => text ?? ''
          } else {
            window.confirm = () => false
            window.prompt = () => null
          }
          sendResponse({ success: true })
          break
        }

        case 'harbor_click_at': {
          const { x, y } = message as { type: string; x: number; y: number }
          const el = document.elementFromPoint(x, y)
          if (el) {
            simulateClick(el)
            const snapshot = takeSnapshot()
            sendResponse({ success: true, data: { snapshot } })
          } else {
            sendResponse({ success: false, error: 'No element at coordinates' })
          }
          break
        }

        case 'harbor_drag': {
          const { fromId, fromSelector, toId, toSelector, toX, toY } = message as {
            type: string
            fromId?: number
            fromSelector?: string
            toId?: number
            toSelector?: string
            toX?: number
            toY?: number
          }
          const source = getTargetElement(fromId, fromSelector)
          if (!source) throw new Error('Source element not found')

          const sourceRect = source.getBoundingClientRect()
          const srcX = sourceRect.x + sourceRect.width / 2
          const srcY = sourceRect.y + sourceRect.height / 2

          let destX = toX ?? 0
          let destY = toY ?? 0
          if (toId || toSelector) {
            const dest = getTargetElement(toId, toSelector)
            if (dest) {
              const destRect = dest.getBoundingClientRect()
              destX = destRect.x + destRect.width / 2
              destY = destRect.y + destRect.height / 2
            }
          }

          source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, clientX: srcX, clientY: srcY }))
          document.dispatchEvent(new DragEvent('dragover', { bubbles: true, clientX: destX, clientY: destY }))
          const target = document.elementFromPoint(destX, destY)
          if (target) {
            target.dispatchEvent(new DragEvent('drop', { bubbles: true, clientX: destX, clientY: destY }))
          }
          source.dispatchEvent(new DragEvent('dragend', { bubbles: true }))
          sendResponse({ success: true })
          break
        }

        default:
          sendResponse({ success: false, error: `Unknown message type: ${message.type}` })
      }
    } catch (err) {
      sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) })
    }
  })()

  return true // Keep message channel open for async response
})

// Let the service worker know the content script is ready
chrome.runtime.sendMessage({ type: 'harbor_content_ready', url: document.location.href }).catch(() => {
  // Extension may not be ready yet, that's ok
})
