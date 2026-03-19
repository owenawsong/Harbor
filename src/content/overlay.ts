/**
 * Harbor Command Palette Overlay
 * Injected into the active tab via content script
 * Provides a centered modal for quick actions (Ctrl+Shift+K)
 */

interface OverlayCommand {
  id: string
  label: string
  description?: string
  icon?: string
  action: () => void
}

let overlayRoot: HTMLDivElement | null = null
let isOverlayOpen = false

/**
 * Inject CSS for the overlay into the page
 */
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

/**
 * Create the overlay DOM structure
 */
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

/**
 * Show the command palette overlay
 */
export function showOverlay(commands: OverlayCommand[]): void {
  if (!overlayRoot) {
    injectOverlayStyles()
    overlayRoot = createOverlayDOM()
    document.documentElement.appendChild(overlayRoot)

    const input = overlayRoot.querySelector('#harbor-overlay-input') as HTMLInputElement
    input.addEventListener('keydown', handleInputKeydown)
  }

  renderCommands(commands, '')
  isOverlayOpen = true
  overlayRoot.classList.add('open')

  const input = overlayRoot.querySelector('#harbor-overlay-input') as HTMLInputElement
  input.focus()
  input.value = ''
}

/**
 * Hide the command palette overlay
 */
export function hideOverlay(): void {
  if (!overlayRoot) return
  overlayRoot.classList.remove('open')
  isOverlayOpen = false
}

/**
 * Render the command list
 */
function renderCommands(commands: OverlayCommand[], filter: string): void {
  if (!overlayRoot) return

  const list = overlayRoot.querySelector('#harbor-overlay-list') as HTMLUListElement

  const filtered = filter.trim()
    ? commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
          cmd.description?.toLowerCase().includes(filter.toLowerCase())
      )
    : commands

  list.innerHTML = filtered
    .map((cmd, idx) => {
      const item = document.createElement('li')
      item.className = 'harbor-overlay-item'
      item.dataset.commandId = cmd.id
      if (idx === 0) item.classList.add('active')

      item.innerHTML = `
        <div class="harbor-overlay-item-label">
          <div class="harbor-overlay-item-title">${escapeHtml(cmd.label)}</div>
          ${cmd.description ? `<div class="harbor-overlay-item-desc">${escapeHtml(cmd.description)}</div>` : ''}
        </div>
      `

      item.addEventListener('click', () => {
        cmd.action()
        hideOverlay()
      })

      return item
    })
    .map((el) => {
      const li = document.createElement('li')
      li.className = filtered[0] ? 'harbor-overlay-item active' : 'harbor-overlay-item'
      li.innerHTML = el.innerHTML
      li.dataset.commandId = filtered[0]?.id
      li.addEventListener('click', () => {
        filtered[0]?.action()
        hideOverlay()
      })
      return li
    })
    .reduce((container, el, idx) => {
      const item = document.createElement('li')
      item.className = 'harbor-overlay-item'
      if (idx === 0) item.classList.add('active')
      item.innerHTML = `<div class="harbor-overlay-item-label"><div class="harbor-overlay-item-title">${escapeHtml(filtered[idx]?.label || '')}</div></div>`
      item.addEventListener('click', () => {
        filtered[idx]?.action()
        hideOverlay()
      })
      container.appendChild(item)
      return container
    }, list)

  // Better approach: clear and rebuild
  list.innerHTML = ''
  filtered.forEach((cmd, idx) => {
    const item = document.createElement('li')
    item.className = 'harbor-overlay-item' + (idx === 0 ? ' active' : '')
    item.dataset.commandId = cmd.id

    const label = document.createElement('div')
    label.className = 'harbor-overlay-item-label'

    const title = document.createElement('div')
    title.className = 'harbor-overlay-item-title'
    title.textContent = cmd.label

    label.appendChild(title)

    if (cmd.description) {
      const desc = document.createElement('div')
      desc.className = 'harbor-overlay-item-desc'
      desc.textContent = cmd.description
      label.appendChild(desc)
    }

    item.appendChild(label)
    item.addEventListener('click', () => {
      cmd.action()
      hideOverlay()
    })

    list.appendChild(item)
  })
}

/**
 * Handle input changes and keyboard navigation
 */
function handleInputKeydown(e: KeyboardEvent): void {
  const input = e.target as HTMLInputElement
  const list = overlayRoot?.querySelector('#harbor-overlay-list') as HTMLUListElement

  if (e.key === 'Escape') {
    e.preventDefault()
    hideOverlay()
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    moveSelection(list, 1)
    return
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    moveSelection(list, -1)
    return
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    const active = list?.querySelector('.harbor-overlay-item.active') as HTMLElement
    if (active) active.click()
    return
  }

  // Filter on text input
  if (e.key.length === 1 || e.key === 'Backspace' || e.key === ' ') {
    setTimeout(() => {
      renderCommands(getAvailableCommands(), input.value)
    }, 0)
  }
}

/**
 * Move selection up or down in the list
 */
function moveSelection(list: HTMLUListElement | null, direction: number): void {
  if (!list) return

  const items = Array.from(list.querySelectorAll('.harbor-overlay-item'))
  const activeIdx = items.findIndex((el) => el.classList.contains('active'))
  const nextIdx = Math.max(0, Math.min(items.length - 1, activeIdx + direction))

  items.forEach((el) => el.classList.remove('active'))
  items[nextIdx]?.classList.add('active')

  const active = items[nextIdx] as HTMLElement
  if (active) {
    active.scrollIntoView({ block: 'nearest' })
  }
}

/**
 * Get available commands from the extension
 */
function getAvailableCommands(): OverlayCommand[] {
  return [
    {
      id: 'new-chat',
      label: 'New Chat',
      description: 'Start a new conversation',
      action: () => {
        chrome.runtime.sendMessage({ type: 'harbor_command', command: 'new_chat' })
      },
    },
    {
      id: 'open-settings',
      label: 'Settings',
      description: 'Configure Harbor',
      action: () => {
        chrome.runtime.sendMessage({ type: 'harbor_command', command: 'open_settings' })
      },
    },
    {
      id: 'toggle-theme',
      label: 'Toggle Theme',
      description: 'Switch light/dark mode',
      action: () => {
        chrome.runtime.sendMessage({ type: 'harbor_command', command: 'toggle_theme' })
      },
    },
  ]
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Toggle the overlay open/closed
 */
export function toggleOverlay(): void {
  if (isOverlayOpen) {
    hideOverlay()
  } else {
    showOverlay(getAvailableCommands())
  }
}

/**
 * Initialize overlay and keyboard listener
 */
export function initializeOverlay(): void {
  // Load shortcut from storage
  chrome.storage.local.get('harbor_keybindings', (data) => {
    let shortcutStr = 'Ctrl+Shift+H' // Default to new shortcut
    if (data.harbor_keybindings?.commandPalette) {
      shortcutStr = data.harbor_keybindings.commandPalette as string
    }

    // Parse shortcut (e.g., "Ctrl+Shift+H" -> key: 'h', ctrl: true, shift: true)
    const parts = shortcutStr.split('+')
    const expectedKey = parts[parts.length - 1].toLowerCase()
    const needsCtrl = parts.includes('Ctrl')
    const needsMeta = parts.includes('Cmd')
    const needsShift = parts.includes('Shift')
    const needsAlt = parts.includes('Alt')

    console.log('🎯 Overlay: Keyboard listener initialized for:', shortcutStr, { expectedKey, needsCtrl, needsMeta, needsShift, needsAlt })

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const ctrlOrMeta = needsCtrl || needsMeta
      const matches =
        e.key.toLowerCase() === expectedKey &&
        (ctrlOrMeta ? (e.ctrlKey || e.metaKey) : true) &&
        e.shiftKey === needsShift &&
        e.altKey === needsAlt

      if (matches) {
        console.log('🎯 Overlay: Command palette hotkey matched!')
        e.preventDefault()
        toggleOverlay()
      }
    })
  })
}
