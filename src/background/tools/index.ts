import type { ToolHandler } from '../agent/types'
import { navigationTools } from './navigation'
import { snapshotTools } from './snapshot'
import { inputTools } from './input'
import { domTools } from './dom'
import { bookmarkTools } from './bookmarks'
import { historyTools } from './history'
import { windowTools, tabGroupTools } from './windows'
import { downloadTools } from './downloads'

export const ALL_TOOLS: ToolHandler[] = [
  ...navigationTools,
  ...snapshotTools,
  ...inputTools,
  ...domTools,
  ...bookmarkTools,
  ...historyTools,
  ...windowTools,
  ...tabGroupTools,
  ...downloadTools,
]

export { navigationTools, snapshotTools, inputTools, domTools, bookmarkTools, historyTools, windowTools, tabGroupTools, downloadTools }

export function getToolByName(name: string): ToolHandler | undefined {
  return ALL_TOOLS.find((t) => t.definition.name === name)
}

export function getToolDefinitions(): import('../../shared/types').ToolDefinition[] {
  return ALL_TOOLS.map((t) => t.definition)
}
