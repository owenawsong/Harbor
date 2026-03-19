/**
 * Modal Detector
 * Detects, analyzes, and helps interact with modal dialogs on web pages.
 */

export interface DetectedModal {
  id: string
  element: Element
  type: 'dialog' | 'overlay' | 'popup' | 'alert' | 'form' | 'custom'
  title?: string
  content: string
  buttons: ModalButton[]
  hasCloseButton: boolean
  isVisible: boolean
  zIndex: number
  position: {
    top: number
    left: number
    width: number
    height: number
  }
}

export interface ModalButton {
  text: string
  element: Element
  type: 'submit' | 'cancel' | 'action' | 'close'
  isPrimary: boolean
}

/**
 * Detects all modals/dialogs on the current page.
 */
export function detectModals(): DetectedModal[] {
  const modals: DetectedModal[] = []

  // Check for various modal types
  const selectors = [
    { selector: 'dialog', type: 'dialog' as const },
    { selector: '[role="dialog"]', type: 'custom' as const },
    { selector: '[role="alertdialog"]', type: 'alert' as const },
    { selector: '.modal, .Modal, .Modal-content', type: 'custom' as const },
    { selector: '[class*="modal"], [class*="Modal"]', type: 'custom' as const },
    { selector: '.popup, .Popup, [class*="popup"]', type: 'popup' as const },
    { selector: '[class*="overlay"], [class*="Overlay"]', type: 'overlay' as const },
  ]

  const processedElements = new Set<Element>()

  for (const { selector, type } of selectors) {
    try {
      document.querySelectorAll(selector).forEach((el) => {
        if (processedElements.has(el)) return
        if (!isVisibleElement(el)) return

        const modal = extractModalInfo(el, type)
        if (modal && modal.content.length > 0) {
          modals.push(modal)
          processedElements.add(el)
        }
      })
    } catch {
      // Selector might be invalid, skip
    }
  }

  // Sort by z-index (higher modals last)
  return modals.sort((a, b) => a.zIndex - b.zIndex)
}

/**
 * Checks if an element is visible on the page.
 */
function isVisibleElement(el: Element): boolean {
  const style = window.getComputedStyle(el)
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
}

/**
 * Extracts detailed info from a modal element.
 */
function extractModalInfo(element: Element, type: DetectedModal['type']): DetectedModal | null {
  // Get visible content (not including script/style tags)
  const content = extractModalContent(element)
  if (!content) return null

  // Try to find title
  const title =
    element.querySelector('h1, h2, h3, .modal-title, [class*="title"]')?.textContent?.trim() ||
    element.getAttribute('aria-label')

  // Find buttons
  const buttons = extractModalButtons(element)

  // Get position and size
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)
  const zIndex = parseInt(style.zIndex) || 0

  // Detect close button
  const hasCloseButton = !!element.querySelector(
    '[aria-label="close"], [class*="close"], button:contains("×"), button:contains("✕")'
  )

  return {
    id: element.id || `modal-${Math.random().toString(36).slice(2, 9)}`,
    element,
    type,
    title,
    content,
    buttons,
    hasCloseButton,
    isVisible: isVisibleElement(element),
    zIndex,
    position: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
  }
}

/**
 * Extracts readable content from a modal.
 */
function extractModalContent(element: Element): string {
  const clone = element.cloneNode(true) as Element

  // Remove script and style tags
  clone.querySelectorAll('script, style, [style*="display:none"]').forEach((el) => el.remove())

  // Get text content, limit to reasonable length
  const text = clone.textContent?.trim() || ''
  return text.substring(0, 1000)
}

/**
 * Extracts button information from a modal.
 */
function extractModalButtons(element: Element): ModalButton[] {
  const buttons: ModalButton[] = []
  const buttonElements = element.querySelectorAll('button, [role="button"], a[class*="button"]')

  buttonElements.forEach((btn) => {
    const text = btn.textContent?.trim() || ''
    if (!text) return

    // Determine button type
    let type: ModalButton['type'] = 'action'
    const lowerText = text.toLowerCase()

    if (lowerText.includes('submit') || lowerText.includes('confirm') || lowerText.includes('ok')) {
      type = 'submit'
    } else if (lowerText.includes('cancel') || lowerText.includes('close') || lowerText.includes('no')) {
      type = 'cancel'
    } else if (lowerText.includes('close') || lowerText === '×' || lowerText === '✕') {
      type = 'close'
    }

    // Check if primary button
    const isPrimary =
      btn.classList.contains('primary') ||
      btn.classList.contains('btn-primary') ||
      btn.getAttribute('type') === 'submit'

    buttons.push({
      text,
      element: btn,
      type,
      isPrimary,
    })
  })

  return buttons
}

/**
 * Finds the primary action button in a modal.
 */
export function getPrimaryButton(modal: DetectedModal): ModalButton | null {
  return modal.buttons.find((b) => b.isPrimary) || modal.buttons.find((b) => b.type === 'submit') || null
}

/**
 * Finds a button by text (case-insensitive).
 */
export function findButtonByText(modal: DetectedModal, text: string): ModalButton | null {
  const lowerText = text.toLowerCase()
  return modal.buttons.find((b) => b.text.toLowerCase().includes(lowerText)) || null
}

/**
 * Clicks a button in the modal.
 */
export function clickModalButton(modal: DetectedModal, button: ModalButton): boolean {
  try {
    const el = button.element as HTMLElement
    el.click()
    return true
  } catch {
    return false
  }
}

/**
 * Closes a modal if possible.
 */
export function closeModal(modal: DetectedModal): boolean {
  // Try close button first
  const closeBtn = modal.buttons.find((b) => b.type === 'close')
  if (closeBtn) {
    return clickModalButton(modal, closeBtn)
  }

  // Try cancel button
  const cancelBtn = modal.buttons.find((b) => b.type === 'cancel')
  if (cancelBtn) {
    return clickModalButton(modal, cancelBtn)
  }

  // Try Escape key
  try {
    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    modal.element.dispatchEvent(event)
    return true
  } catch {
    return false
  }
}

/**
 * Gets a readable description of a modal.
 */
export function getModalDescription(modal: DetectedModal): string {
  const lines: string[] = []

  if (modal.title) {
    lines.push(`Title: ${modal.title}`)
  }

  lines.push(`Type: ${modal.type}`)
  lines.push(`Content: ${modal.content.substring(0, 200)}...`)

  if (modal.buttons.length > 0) {
    lines.push(`Buttons: ${modal.buttons.map((b) => `"${b.text}" (${b.type})`).join(', ')}`)
  }

  if (modal.hasCloseButton) {
    lines.push('Has close button')
  }

  return lines.join('\n')
}
