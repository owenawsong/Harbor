/**
 * Table Extractor
 * Extracts structured table data from web pages.
 */

export interface TableCell {
  content: string
  isHeader: boolean
  rowSpan?: number
  colSpan?: number
}

export interface ExtractedTable {
  id: string
  title?: string
  rows: TableCell[][]
  headers?: string[]
  rowCount: number
  colCount: number
  sourceElement?: string
}

/**
 * Extracts all tables from the current page.
 * Called from content script context.
 */
export function extractTablesFromPage(): ExtractedTable[] {
  const tables: ExtractedTable[] = []
  const pageTableElements = document.querySelectorAll('table')

  pageTableElements.forEach((tableEl, idx) => {
    try {
      const extracted = extractTableData(tableEl, idx)
      if (extracted) tables.push(extracted)
    } catch (err) {
      console.error('Error extracting table:', err)
    }
  })

  return tables
}

/**
 * Extracts data from a single table element.
 */
function extractTableData(tableEl: Element, index: number): ExtractedTable | null {
  const rows: TableCell[][] = []

  // Extract rows from thead, tbody, tfoot
  const sections = tableEl.querySelectorAll('thead, tbody, tfoot')
  let hasData = false

  sections.forEach((section) => {
    section.querySelectorAll('tr').forEach((tr) => {
      const cells: TableCell[] = []
      const cellElements = tr.querySelectorAll('td, th')

      cellElements.forEach((cell) => {
        const isHeader = cell.tagName.toLowerCase() === 'th'
        const content = cell.textContent?.trim() || ''
        const rowSpan = parseInt(cell.getAttribute('rowspan') || '1')
        const colSpan = parseInt(cell.getAttribute('colspan') || '1')

        if (content) hasData = true

        cells.push({
          content,
          isHeader,
          rowSpan: rowSpan > 1 ? rowSpan : undefined,
          colSpan: colSpan > 1 ? colSpan : undefined,
        })
      })

      if (cells.length > 0) {
        rows.push(cells)
      }
    })
  })

  if (!hasData) return null

  // Extract title from caption or preceding heading
  let title: string | undefined
  const caption = tableEl.querySelector('caption')
  if (caption?.textContent) {
    title = caption.textContent.trim()
  }

  const colCount = rows.length > 0 ? rows[0].length : 0

  return {
    id: `table-${index}`,
    title,
    rows,
    headers: extractHeaders(rows),
    rowCount: rows.length,
    colCount,
    sourceElement: tableEl.id || tableEl.className || 'table',
  }
}

/**
 * Extracts header row from table data.
 */
function extractHeaders(rows: TableCell[][]): string[] | undefined {
  if (rows.length === 0) return undefined

  // Check if first row contains headers
  const firstRow = rows[0]
  if (firstRow.some((cell) => cell.isHeader)) {
    return firstRow.map((cell) => cell.content)
  }

  // Check for thead with headers
  return undefined
}

/**
 * Converts extracted table to CSV format.
 */
export function tableToCSV(table: ExtractedTable): string {
  const lines: string[] = []

  // Add title as comment if available
  if (table.title) {
    lines.push(`# ${table.title}`)
  }

  // Add headers if available
  if (table.headers) {
    lines.push(table.headers.map(escapeCSV).join(','))
  }

  // Add data rows
  for (const row of table.rows) {
    const csvRow = row.map((cell) => escapeCSV(cell.content)).join(',')
    lines.push(csvRow)
  }

  return lines.join('\n')
}

/**
 * Converts extracted table to JSON format.
 */
export function tableToJSON(table: ExtractedTable): Record<string, unknown> {
  const data: Record<string, unknown>[] = []

  for (const row of table.rows) {
    const rowObj: Record<string, unknown> = {}
    row.forEach((cell, idx) => {
      const key = table.headers?.[idx] || `col_${idx}`
      rowObj[key] = cell.content
    })
    data.push(rowObj)
  }

  return {
    title: table.title,
    rowCount: table.rowCount,
    colCount: table.colCount,
    data,
  }
}

/**
 * Converts extracted table to Markdown format.
 */
export function tableToMarkdown(table: ExtractedTable): string {
  const lines: string[] = []

  // Add title
  if (table.title) {
    lines.push(`# ${table.title}\n`)
  }

  if (table.rows.length === 0) return lines.join('\n')

  const firstRow = table.rows[0]
  const headers = table.headers || firstRow.map((_, i) => `Col ${i + 1}`)

  // Header row
  lines.push(`| ${headers.map(escapeMarkdown).join(' | ')} |`)

  // Separator
  lines.push(`| ${headers.map(() => '---').join(' | ')} |`)

  // Data rows
  for (let i = table.headers ? 0 : 1; i < table.rows.length; i++) {
    const row = table.rows[i]
    const cells = row.map((cell) => escapeMarkdown(cell.content))
    lines.push(`| ${cells.join(' | ')} |`)
  }

  return lines.join('\n')
}

/**
 * Escapes CSV special characters.
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"` // Escape quotes by doubling
  }
  return value
}

/**
 * Escapes Markdown special characters.
 */
function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br/>')
}

/**
 * Finds tables matching criteria (by title, ID, or position).
 */
export function findTables(
  tables: ExtractedTable[],
  criteria: { title?: string; id?: string; index?: number }
): ExtractedTable[] {
  return tables.filter((t) => {
    if (criteria.title && !t.title?.includes(criteria.title)) return false
    if (criteria.id && t.id !== criteria.id) return false
    if (criteria.index !== undefined && t.id !== `table-${criteria.index}`) return false
    return true
  })
}
