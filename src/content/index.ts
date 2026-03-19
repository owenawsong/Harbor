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

/**
 * Get all visible interactive elements on the page
 */
function getAllInteractiveElements(): SnapshotElement[] {
  const elements: SnapshotElement[] = []

  function processElement(el: Element) {
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
    }

    // Process children
    for (const child of el.children) {
      processElement(child)
    }
  }

  processElement(document.body)
  return elements
}

/**
 * Format element to text line
 */
function formatElementLine(el: SnapshotElement): string {
  let line = `[${el.id}] `
  if (el.role === 'link' || el.tag === 'a') {
    line += `<link> "${el.text}"${el.href ? ` → ${el.href}` : ''}`
  } else if (el.role === 'button' || el.tag === 'button') {
    line += `<button> "${el.text}"${el.disabled ? ' (disabled)' : ''}`
  } else if (el.role === 'textbox' || el.tag === 'textarea') {
    line += `<input:${el.type || 'text'}> ${el.placeholder ? `placeholder="${el.placeholder}"` : ''}${el.value ? ` value="${el.value}"` : ''}`
  } else if (el.role === 'checkbox') {
    line += `<checkbox> "${el.text}" ${el.checked ? '(checked)' : '(unchecked)'}`
  } else if (el.role === 'radio') {
    line += `<radio> "${el.text}" ${el.checked ? '(selected)' : '(unselected)'}`
  } else if (el.role === 'combobox' || el.tag === 'select') {
    line += `<select> "${el.text || el.value}"`
  } else {
    line += `<${el.role || el.tag}> "${el.text}"`
  }
  return line
}

/**
 * Get viewport bounds
 */
function getViewportBounds(): { top: number; bottom: number; left: number; right: number } {
  return {
    top: window.scrollY,
    bottom: window.scrollY + window.innerHeight,
    left: window.scrollX,
    right: window.scrollX + window.innerWidth,
  }
}

/**
 * Check if element is in viewport
 */
function isInViewport(el: SnapshotElement): boolean {
  const viewport = getViewportBounds()
  return !(
    el.y > viewport.bottom ||
    el.y + el.height < viewport.top ||
    el.x > viewport.right ||
    el.x + el.width < viewport.left
  )
}

function takeSnapshot(options?: { offset?: number; limit?: number; viewportOnly?: boolean }): PageSnapshot {
  resetElements()
  const offset = options?.offset ?? 0
  const limit = options?.limit ?? 500
  const viewportOnly = options?.viewportOnly ?? false

  // Get all interactive elements
  const allElements = getAllInteractiveElements()

  // Filter to viewport if requested
  const filtered = viewportOnly
    ? allElements.filter(isInViewport)
    : allElements

  // Apply pagination
  const paginated = filtered.slice(offset, offset + limit)

  // Format lines
  const lines = paginated.map(formatElementLine)

  const formattedText = [
    `URL: ${document.location.href}`,
    `Title: ${document.title}`,
    ``,
    `=== Interactive Elements (${offset}-${offset + paginated.length} of ${filtered.length}) ===`,
    ...lines,
  ].join('\n')

  return {
    url: document.location.href,
    title: document.title,
    elements: paginated,
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

// ─── Modal Detection ──────────────────────────────────────────────────────────

interface DetectedModal {
  tag: string
  role?: string
  selector: string
  isVisible: boolean
  text?: string
}

function detectVisibleModal(): DetectedModal | null {
  // Common modal selectors
  const modalSelectors = [
    '[role="dialog"]',
    '[role="alertdialog"]',
    '.modal',
    '.dialog',
    '.popup',
    '.overlay[class*="modal"]',
    '[aria-modal="true"]',
  ]

  for (const selector of modalSelectors) {
    const modals = document.querySelectorAll(selector)
    for (const modal of modals) {
      if (isVisible(modal)) {
        return {
          tag: modal.tagName.toLowerCase(),
          role: modal.getAttribute('role') ?? undefined,
          selector,
          isVisible: true,
          text: modal.textContent?.slice(0, 100),
        }
      }
    }
  }

  return null
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

  // Get the native setter for the correct element type
  let nativeValueSetter: ((value: string) => void) | undefined
  if (inputEl instanceof HTMLInputElement) {
    nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  } else if (inputEl instanceof HTMLTextAreaElement) {
    nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  }

  if (nativeValueSetter) {
    nativeValueSetter.call(inputEl, inputEl.value + text)
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
        case 'harbor_agent_running': {
          showAgentIndicator()
          sendResponse({ success: true })
          break
        }

        case 'harbor_agent_stopped': {
          hideAgentIndicator()
          sendResponse({ success: true })
          break
        }

        case 'harbor_ping': {
          sendResponse({ success: true, pong: true })
          break
        }

        case 'harbor_snapshot': {
          const { offset, limit, viewportOnly } = message as {
            type: string
            offset?: number
            limit?: number
            viewportOnly?: boolean
          }
          const snapshot = takeSnapshot({ offset, limit, viewportOnly })
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
          // Inject a script tag to bypass CSP restrictions
          const result = await new Promise<unknown>((resolve, reject) => {
            const randomId = Math.random().toString(36).substring(7)
            const handler = (event: CustomEvent) => {
              if (event.detail.id === randomId) {
                window.removeEventListener(`harbor-eval-result-${randomId}`, handler as EventListener)
                if (event.detail.error) {
                  reject(new Error(event.detail.error))
                } else {
                  resolve(event.detail.result)
                }
              }
            }
            window.addEventListener(`harbor-eval-result-${randomId}`, handler as EventListener)

            const script = document.createElement('script')
            script.textContent = `
              (function() {
                try {
                  const result = (function() { return (async () => { return ${expression} })() }).call(window)
                  Promise.resolve(result).then(r => {
                    window.dispatchEvent(new CustomEvent('harbor-eval-result-${randomId}', { detail: { id: '${randomId}', result: r } }))
                  }).catch(err => {
                    window.dispatchEvent(new CustomEvent('harbor-eval-result-${randomId}', { detail: { id: '${randomId}', error: err.message } }))
                  })
                } catch (err) {
                  window.dispatchEvent(new CustomEvent('harbor-eval-result-${randomId}', { detail: { id: '${randomId}', error: err.message } }))
                }
              })()
            `
            document.documentElement.appendChild(script)
            script.remove()

            // Timeout after 10 seconds
            setTimeout(() => {
              reject(new Error('Evaluation timeout'))
            }, 10000)
          })
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

        case 'harbor_extract_tables': {
          const { format = 'json', maxTables = 20 } = message as { type: string; format?: string; maxTables?: number }
          const tables: unknown[] = []
          document.querySelectorAll('table').forEach((table, idx) => {
            if (idx >= maxTables) return
            const rows: string[][] = []
            table.querySelectorAll('tr').forEach((tr) => {
              const cells: string[] = []
              tr.querySelectorAll('td, th').forEach((cell) => {
                cells.push(cell.textContent?.trim() ?? '')
              })
              if (cells.length > 0) rows.push(cells)
            })
            if (rows.length > 0) {
              if (format === 'json') {
                const headers = rows[0] ?? []
                const data = rows.slice(1).map((row) =>
                  Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']))
                )
                tables.push({ headers, data })
              } else if (format === 'markdown') {
                const md = rows.map((row) => `| ${row.join(' | ')} |`).join('\n')
                tables.push(md)
              } else if (format === 'csv') {
                const csv = rows.map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
                tables.push(csv)
              }
            }
          })
          sendResponse({ success: true, data: tables })
          break
        }

        case 'harbor_get_selected_text': {
          const selectedText = window.getSelection()?.toString() ?? ''
          sendResponse({ success: true, data: selectedText })
          break
        }

        case 'harbor_extract_by_selector': {
          const { selectors, limit = 20 } = message as { type: string; selectors: Record<string, string>; limit?: number }
          const results: Record<string, unknown[]> = {}
          for (const [name, selector] of Object.entries(selectors)) {
            try {
              results[name] = Array.from(document.querySelectorAll(selector))
                .slice(0, limit)
                .map((el) => ({
                  tag: el.tagName.toLowerCase(),
                  text: el.textContent?.trim().slice(0, 200),
                  html: el.innerHTML.slice(0, 500),
                }))
            } catch {
              results[name] = []
            }
          }
          sendResponse({ success: true, data: results })
          break
        }

        case 'harbor_get_local_storage': {
          const { keys } = message as { type: string; keys?: string[] }
          const items: Record<string, unknown> = {}
          if (keys && keys.length > 0) {
            keys.forEach((k) => {
              items[k] = localStorage.getItem(k)
            })
          } else {
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i)
              if (k) items[k] = localStorage.getItem(k)
            }
          }
          sendResponse({ success: true, data: items })
          break
        }

        case 'harbor_set_local_storage': {
          const { items } = message as { type: string; items: Record<string, unknown> }
          try {
            for (const [k, v] of Object.entries(items)) {
              localStorage.setItem(k, String(v))
            }
            sendResponse({ success: true })
          } catch (err) {
            sendResponse({ success: false, error: String(err) })
          }
          break
        }

        case 'harbor_get_session_storage': {
          const { keys } = message as { type: string; keys?: string[] }
          const items: Record<string, unknown> = {}
          if (keys && keys.length > 0) {
            keys.forEach((k) => {
              items[k] = sessionStorage.getItem(k)
            })
          } else {
            for (let i = 0; i < sessionStorage.length; i++) {
              const k = sessionStorage.key(i)
              if (k) items[k] = sessionStorage.getItem(k)
            }
          }
          sendResponse({ success: true, data: items })
          break
        }

        case 'harbor_set_session_storage': {
          const { items } = message as { type: string; items: Record<string, unknown> }
          try {
            for (const [k, v] of Object.entries(items)) {
              sessionStorage.setItem(k, String(v))
            }
            sendResponse({ success: true })
          } catch (err) {
            sendResponse({ success: false, error: String(err) })
          }
          break
        }

        case 'harbor_delete_local_storage': {
          const { keys } = message as { type: string; keys?: string[] }
          try {
            if (keys && keys.length > 0) {
              keys.forEach((k) => localStorage.removeItem(k))
              sendResponse({ success: true, data: keys })
            } else {
              localStorage.clear()
              sendResponse({ success: true, data: 'all' })
            }
          } catch (err) {
            sendResponse({ success: false, error: String(err) })
          }
          break
        }

        case 'harbor_find_file_inputs': {
          const inputs: Array<{ id: number; name?: string; accept?: string }> = []
          document.querySelectorAll('input[type="file"]').forEach((input) => {
            const id = assignId(input)
            inputs.push({
              id,
              name: (input as HTMLInputElement).name,
              accept: (input as HTMLInputElement).accept,
            })
          })
          sendResponse({ success: true, data: inputs })
          break
        }

        case 'harbor_detect_modal': {
          const modal = detectVisibleModal()
          sendResponse({ success: true, data: { isPresent: !!modal, modal } })
          break
        }

        case 'harbor_wait_for_modal': {
          const { timeout = 30000 } = message as { type: string; timeout?: number }
          const startTime = Date.now()
          let found = false
          let modal: Record<string, unknown> | undefined

          while (Date.now() - startTime < timeout) {
            modal = detectVisibleModal()
            if (modal) {
              found = true
              break
            }
            await new Promise((resolve) => setTimeout(resolve, 500))
          }

          sendResponse({ success: true, data: { found, modal } })
          break
        }

        case 'harbor_close_modal': {
          const { method = 'escape' } = message as { type: string; method?: string }
          try {
            if (method === 'escape') {
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
            } else if (method === 'close_button') {
              const closeBtn = document.querySelector('[role="button"][aria-label*="close" i], .close, .modal-close, [class*="close"]')
              if (closeBtn instanceof HTMLElement) closeBtn.click()
            }
            sendResponse({ success: true })
          } catch (err) {
            sendResponse({ success: false, error: String(err) })
          }
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

// ─── Agent Running Indicator ──────────────────────────────────────────────────

let harborAgentBar: HTMLDivElement | null = null
let harborStatusPill: HTMLDivElement | null = null

function showAgentIndicator(): void {
  if (harborAgentBar) return

  // Inject keyframe styles once
  if (!document.getElementById('harbor-agent-styles')) {
    const style = document.createElement('style')
    style.id = 'harbor-agent-styles'
    style.textContent = `
      @keyframes harbor-scan {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(350%); }
      }
      @keyframes harbor-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(78, 142, 168, 0.7); }
        50% { box-shadow: 0 0 0 4px rgba(78, 142, 168, 0.3); }
      }
    `
    document.head.appendChild(style)
  }

  // Top indicator bar
  const bar = document.createElement('div')
  bar.id = 'harbor-agent-indicator'
  bar.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'right:0',
    'height:3px', 'z-index:2147483647', 'pointer-events:none',
    'overflow:hidden', 'background:rgba(78,142,168,0.88)',
    'opacity:0', 'transition:opacity 350ms ease',
  ].join(';')

  const shimmer = document.createElement('div')
  shimmer.style.cssText = [
    'position:absolute', 'top:0', 'bottom:0', 'width:35%',
    'background:linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)',
    'animation:harbor-scan 1.4s ease-in-out infinite',
  ].join(';')

  bar.appendChild(shimmer)
  document.documentElement.appendChild(bar)
  harborAgentBar = bar

  // Bottom-center status pill
  const pill = document.createElement('div')
  pill.id = 'harbor-status-pill'
  pill.style.cssText = [
    'position:fixed', 'bottom:20px', 'left:50%', 'transform:translateX(-50%)',
    'z-index:2147483647', 'pointer-events:none',
    'padding:8px 16px', 'border-radius:20px',
    'background:rgba(78,142,168,0.95)', 'color:white',
    'font-size:13px', 'font-weight:500', 'font-family:system-ui,-apple-system,sans-serif',
    'box-shadow:0 4px 12px rgba(0,0,0,0.15)',
    'display:flex', 'align-items:center', 'gap:8px',
    'opacity:0', 'transition:opacity 350ms ease',
  ].join(';')

  const indicator = document.createElement('div')
  indicator.style.cssText = [
    'width:6px', 'height:6px', 'border-radius:50%',
    'background:rgba(255,255,255,0.9)',
    'animation:harbor-pulse 2s infinite',
  ].join(';')

  const text = document.createElement('span')
  text.textContent = 'Harbor is accessing the screen'

  pill.appendChild(indicator)
  pill.appendChild(text)
  document.documentElement.appendChild(pill)
  harborStatusPill = pill

  // Trigger fade-in on next frame
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (harborAgentBar) harborAgentBar.style.opacity = '1'
    if (harborStatusPill) harborStatusPill.style.opacity = '1'
  }))
}

function hideAgentIndicator(): void {
  if (harborAgentBar) {
    const bar = harborAgentBar
    harborAgentBar = null
    bar.style.opacity = '0'
    setTimeout(() => bar.remove(), 400)
  }
  if (harborStatusPill) {
    const pill = harborStatusPill
    harborStatusPill = null
    pill.style.opacity = '0'
    setTimeout(() => pill.remove(), 400)
  }
}

// ─── Command Palette Overlay ─────────────────────────────────────────────────

// Simple overlay implementation inline (to avoid module issues with content scripts)
let overlayRoot: HTMLDivElement | null = null
let isOverlayOpen = false

function injectOverlayStyles(): void {
  if (document.getElementById('harbor-overlay-styles')) return

  const style = document.createElement('style')
  style.id = 'harbor-overlay-styles'
  style.textContent = `
    #harbor-overlay-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 2147483646;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 120px;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
      opacity: 0;
      visibility: hidden;
      transition: opacity 150ms ease, visibility 150ms ease;
      pointer-events: none;
    }

    #harbor-overlay-container.open {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    #harbor-overlay-box {
      background: rgb(var(--harbor-bg, 255, 255, 255));
      border: 1px solid rgb(var(--harbor-border, 200, 200, 200));
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      width: 90%;
      max-width: 500px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 70vh;
    }

    #harbor-overlay-input {
      padding: 12px 16px;
      font-size: 15px;
      border: none;
      border-bottom: 1px solid rgb(var(--harbor-border, 200, 200, 200));
      background: transparent;
      color: rgb(var(--harbor-text, 0, 0, 0));
      outline: none;
      font-family: inherit;
    }

    #harbor-overlay-input::placeholder {
      color: rgb(var(--harbor-text-muted, 100, 100, 100));
    }

    #harbor-overlay-list {
      overflow-y: auto;
      max-height: calc(70vh - 50px);
      list-style: none;
      margin: 0;
      padding: 4px 0;
    }

    .harbor-overlay-item {
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: rgb(var(--harbor-text, 0, 0, 0));
      border-left: 3px solid transparent;
      transition: background-color 100ms ease;
    }

    .harbor-overlay-item:hover {
      background-color: rgba(78, 142, 168, 0.08);
    }

    .harbor-overlay-item.active {
      background-color: rgba(78, 142, 168, 0.15);
      border-left-color: rgb(78, 142, 168);
    }

    .harbor-overlay-item-label {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .harbor-overlay-item-title {
      font-weight: 500;
    }

    .harbor-overlay-item-desc {
      font-size: 11px;
      color: rgb(var(--harbor-text-muted, 100, 100, 100));
    }
  `
  document.head.appendChild(style)
}

function createOverlayDOM(): HTMLDivElement {
  const container = document.createElement('div')
  container.id = 'harbor-overlay-container'

  const box = document.createElement('div')
  box.id = 'harbor-overlay-box'

  const input = document.createElement('input')
  input.id = 'harbor-overlay-input'
  input.type = 'text'
  input.placeholder = 'Search or type command...'
  input.spellcheck = false

  const list = document.createElement('ul')
  list.id = 'harbor-overlay-list'

  box.appendChild(input)
  box.appendChild(list)
  container.appendChild(box)

  return container
}

function toggleOverlay(): void {
  if (!overlayRoot) {
    injectOverlayStyles()
    overlayRoot = createOverlayDOM()
    document.documentElement.appendChild(overlayRoot)
  }

  if (isOverlayOpen) {
    overlayRoot.classList.remove('open')
    isOverlayOpen = false
  } else {
    overlayRoot.classList.add('open')
    isOverlayOpen = true
    const input = overlayRoot.querySelector('#harbor-overlay-input') as HTMLInputElement
    input.focus()
    input.value = ''
  }
}

// Keyboard listener for Ctrl+Shift+K
window.addEventListener('keydown', (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    toggleOverlay()
  }
})

// Overlay interaction handler
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (!overlayRoot?.classList.contains('open')) return
  if (e.key === 'Escape') {
    e.preventDefault()
    overlayRoot.classList.remove('open')
    isOverlayOpen = false
  }
}, true)

// Let the service worker know the content script is ready
chrome.runtime.sendMessage({ type: 'harbor_content_ready', url: document.location.href }).catch(() => {
  // Extension may not be ready yet, that's ok
})
