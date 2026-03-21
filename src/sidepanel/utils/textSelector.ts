/**
 * Text Selector Utility
 * Handles text selection on the page and provides context-aware selection features.
 */

export interface TextSelection {
  text: string
  html: string
  startOffset: number
  endOffset: number
  isRange: boolean
  context: {
    before: string
    after: string
    paragraph?: string
    link?: string
  }
}

/**
 * Gets current text selection from the page.
 * Called from content script with access to window.getSelection().
 */
export function getCurrentSelection(): TextSelection | null {
  const selection = window.getSelection()
  if (!selection || selection.toString().length === 0) {
    return null
  }

  const text = selection.toString()
  const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null

  if (!range) return null

  // Get HTML content of selection
  const fragment = range.cloneContents()
  const html = new XMLSerializer().serializeToString(fragment)

  // Get context
  const container = range.commonAncestorContainer
  const parent = container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as Element)

  const context = {
    before: getContextBefore(range),
    after: getContextAfter(range),
    paragraph: parent?.closest('p')?.textContent || undefined,
    link: (parent?.closest('a') as HTMLAnchorElement)?.href || undefined,
  }

  return {
    text,
    html,
    startOffset: range.startOffset,
    endOffset: range.endOffset,
    isRange: !selection.isCollapsed,
    context,
  }
}

/**
 * Gets text context before the selection.
 */
function getContextBefore(range: Range, chars: number = 50): string {
  const preRange = range.cloneRange()
  preRange.collapse(true) // Collapse to start
  preRange.setStart(range.startContainer, Math.max(0, range.startOffset - chars))

  return preRange.toString()
}

/**
 * Gets text context after the selection.
 */
function getContextAfter(range: Range, chars: number = 50): string {
  const postRange = range.cloneRange()
  postRange.collapse(false) // Collapse to end
  postRange.setEnd(range.endContainer, Math.min(range.endContainer.textContent?.length || 0, range.endOffset + chars))

  return postRange.toString()
}

/**
 * Highlights text selection on the page for visual feedback.
 */
export function highlightSelection(selection: TextSelection, color: string = '#FFE082'): HTMLElement | null {
  const range = window.getSelection()?.getRangeAt(0)
  if (!range) return null

  const span = document.createElement('span')
  span.style.backgroundColor = color
  span.style.cursor = 'pointer'
  span.className = 'harbor-selection-highlight'
  span.setAttribute('data-harbor-id', 'selection-highlight')

  try {
    range.surroundContents(span)
    return span
  } catch {
    // surroundContents fails if range spans multiple elements
    // Fall back to using extractContents
    const fragment = range.extractContents()
    span.appendChild(fragment)
    range.insertNode(span)
    return span
  }
}

/**
 * Clears all highlights from the page.
 */
export function clearHighlights(): void {
  document.querySelectorAll('[data-harbor-id="selection-highlight"]').forEach((el) => {
    const parent = el.parentNode
    if (parent) {
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el)
      }
      parent.removeChild(el)
    }
  })
}

/**
 * Finds all instances of text on the page.
 */
export function findAllText(searchText: string): TextSelection[] {
  const results: TextSelection[] = []
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  )

  let node: Node | null
  while ((node = walker.nextNode())) {
    const text = node.textContent || ''
    let index = 0

    while ((index = text.indexOf(searchText, index)) !== -1) {
      const range = document.createRange()
      range.setStart(node, index)
      range.setEnd(node, index + searchText.length)

      const selection: TextSelection = {
        text: searchText,
        html: new XMLSerializer().serializeToString(range.cloneContents()),
        startOffset: index,
        endOffset: index + searchText.length,
        isRange: true,
        context: {
          before: getContextBefore(range),
          after: getContextAfter(range),
          paragraph: (node.parentElement?.closest('p'))?.textContent || undefined,
          link: (node.parentElement?.closest('a') as HTMLAnchorElement)?.href || undefined,
        },
      }

      results.push(selection)
      index += searchText.length
    }
  }

  return results
}

/**
 * Selects and highlights text programmatically.
 */
export function selectText(searchText: string, highlightColor?: string): boolean {
  const instances = findAllText(searchText)

  if (instances.length === 0) {
    return false
  }

  // Select the first instance
  const selection = window.getSelection()
  if (selection && instances[0]) {
    const range = document.createRange()
    // This is simplified; proper implementation would reconstruct the range
    // For now we just highlight the first instance found
    highlightSelection(instances[0], highlightColor)
    return true
  }

  return false
}

/**
 * Gets readable text representation of a selection.
 */
export function getReadableSelection(selection: TextSelection): string {
  return `
"${selection.text}"

Context:
- Before: "${selection.context.before}"
- After: "${selection.context.after}"
${selection.context.link ? `- From link: ${selection.context.link}` : ''}
${selection.context.paragraph ? `- Paragraph: ${selection.context.paragraph.substring(0, 100)}...` : ''}
  `.trim()
}
