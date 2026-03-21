/**
 * Data Manager - Export and Import all user data
 * Handles conversations, settings, presets, and all user state
 */

import type { Message, OnboardingData, ModelPreset } from './types'

export interface ExportData {
  version: string
  exportDate: string
  data: {
    settings?: Record<string, unknown>
    onboarding?: OnboardingData
    presets?: ModelPreset[]
    conversations?: {
      id: string
      title: string
      messages: Message[]
      createdAt: number
      updatedAt: number
    }[]
    bookmarks?: {
      id: string
      title: string
      url: string
      timestamp: number
    }[]
  }
}

const STORAGE_KEYS = {
  settings: 'harbor:settings',
  onboarding: 'harbor:onboarding',
  presets: 'harbor:presets',
  conversations: 'harbor:conversations',
  bookmarks: 'harbor:bookmarks',
}

export async function exportAllData(): Promise<ExportData> {
  const data: ExportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    data: {},
  }

  // Get settings
  const settings = await chrome.storage.local.get(STORAGE_KEYS.settings)
  if (settings[STORAGE_KEYS.settings]) {
    data.data.settings = settings[STORAGE_KEYS.settings] as Record<string, unknown>
  }

  // Get onboarding
  const onboarding = await chrome.storage.local.get(STORAGE_KEYS.onboarding)
  if (onboarding[STORAGE_KEYS.onboarding]) {
    data.data.onboarding = onboarding[STORAGE_KEYS.onboarding] as OnboardingData
  }

  // Get presets
  const presets = await chrome.storage.local.get(STORAGE_KEYS.presets)
  if (presets[STORAGE_KEYS.presets]) {
    data.data.presets = presets[STORAGE_KEYS.presets] as ModelPreset[]
  }

  // Get conversations (limited - only last 50 to avoid huge exports)
  const conversations = await chrome.storage.local.get(STORAGE_KEYS.conversations)
  if (conversations[STORAGE_KEYS.conversations]) {
    const allConversations = conversations[STORAGE_KEYS.conversations] as typeof data.data.conversations
    data.data.conversations = allConversations?.slice(-50) || []
  }

  // Get bookmarks
  const bookmarks = await chrome.storage.local.get(STORAGE_KEYS.bookmarks)
  if (bookmarks[STORAGE_KEYS.bookmarks]) {
    data.data.bookmarks = bookmarks[STORAGE_KEYS.bookmarks] as typeof data.data.bookmarks
  }

  return data
}

export async function importData(exportData: ExportData, options?: { overwrite?: boolean }): Promise<{ success: boolean; message: string }> {
  try {
    // Validate version
    if (exportData.version !== '1.0') {
      return { success: false, message: 'Unsupported export version' }
    }

    if (!options?.overwrite) {
      // Check if data already exists
      const existing = await chrome.storage.local.get([STORAGE_KEYS.settings])
      if (existing[STORAGE_KEYS.settings]) {
        return {
          success: false,
          message: 'Data already exists. Enable "Overwrite" to replace existing data.',
        }
      }
    }

    const updates: Record<string, unknown> = {}

    // Import settings
    if (exportData.data.settings) {
      updates[STORAGE_KEYS.settings] = exportData.data.settings
    }

    // Import onboarding
    if (exportData.data.onboarding) {
      updates[STORAGE_KEYS.onboarding] = exportData.data.onboarding
    }

    // Import presets
    if (exportData.data.presets) {
      updates[STORAGE_KEYS.presets] = exportData.data.presets
    }

    // Import conversations
    if (exportData.data.conversations) {
      updates[STORAGE_KEYS.conversations] = exportData.data.conversations
    }

    // Import bookmarks
    if (exportData.data.bookmarks) {
      updates[STORAGE_KEYS.bookmarks] = exportData.data.bookmarks
    }

    await chrome.storage.local.set(updates)

    return {
      success: true,
      message: `Imported ${Object.keys(updates).length} data sections successfully`,
    }
  } catch (error) {
    console.error('Import error:', error)
    return { success: false, message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

export function getExportFileName(): string {
  const date = new Date().toISOString().split('T')[0]
  return `harbor-backup-${date}.json`
}

export function downloadExportAsFile(data: ExportData): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = getExportFileName()
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function parseImportFile(file: File): Promise<{ success: boolean; data?: ExportData; error?: string }> {
  try {
    const text = await file.text()
    const data = JSON.parse(text) as ExportData
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: `Invalid file format: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
