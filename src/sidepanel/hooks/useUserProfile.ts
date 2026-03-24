import { useCallback, useState, useEffect } from 'react'
import type { UserProfile, UserProfileUpdate } from '../../shared/types'

const PROFILE_STORAGE_KEY = 'harbor_user_profile'
const DEFAULT_PROFILE: UserProfile = {
  id: 'default',
  lastUpdated: Date.now(),
  communicationStyle: 'detailed',
  responseDetailLevel: 'moderate',
  preferredLanguage: 'English',
  confidence: {
    preferences: 0.5,
    habits: 0.3,
    expertise: 0.4,
    personalityTraits: 0.3,
  },
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [isLoading, setIsLoading] = useState(true)

  // Load profile from storage
  useEffect(() => {
    chrome.storage.local.get(PROFILE_STORAGE_KEY, (data) => {
      if (data[PROFILE_STORAGE_KEY]) {
        setProfile(data[PROFILE_STORAGE_KEY])
      } else {
        setProfile(DEFAULT_PROFILE)
      }
      setIsLoading(false)
    })
  }, [])

  const saveProfile = useCallback((newProfile: UserProfile) => {
    newProfile.lastUpdated = Date.now()
    setProfile(newProfile)
    chrome.storage.local.set({ [PROFILE_STORAGE_KEY]: newProfile })
  }, [])

  const updateProfileField = useCallback(
    (field: keyof Omit<UserProfile, 'id' | 'lastUpdated' | 'confidence'>, value: any) => {
      const updated = { ...profile, [field]: value }
      saveProfile(updated)
    },
    [profile, saveProfile]
  )

  const updateConfidence = useCallback(
    (category: keyof Exclude<UserProfile['confidence'], undefined>, score: number) => {
      const updated = {
        ...profile,
        confidence: {
          ...profile.confidence,
          [category]: Math.max(0, Math.min(1, score)), // Clamp to 0-1
        },
      }
      saveProfile(updated)
    },
    [profile, saveProfile]
  )

  const recordObservation = useCallback(
    (update: UserProfileUpdate) => {
      const field = update.field as keyof Omit<UserProfile, 'id' | 'lastUpdated' | 'confidence'>

      // For array fields, append instead of replace
      if (Array.isArray(profile[field])) {
        const arr = profile[field] as any[]
        if (!arr.includes(update.value)) {
          const updated = { ...profile, [field]: [...arr, update.value] }
          saveProfile(updated)
        }
      } else {
        // For scalar fields, update directly
        const updated = { ...profile, [field]: update.value }
        saveProfile(updated)
      }

      // Update confidence if provided
      if (update.confidence && profile.confidence) {
        updateConfidence(field as any, update.confidence)
      }
    },
    [profile, saveProfile, updateConfidence]
  )

  const getFormattedProfile = useCallback((): string => {
    const lines: string[] = []

    if (profile.name) lines.push(`**Name**: ${profile.name}`)
    if (profile.role) lines.push(`**Role**: ${profile.role}`)
    if (profile.timezone) lines.push(`**Timezone**: ${profile.timezone}`)

    if (profile.communicationStyle) lines.push(`**Communication Style**: ${profile.communicationStyle}`)
    if (profile.responseDetailLevel) lines.push(`**Preferred Response Detail**: ${profile.responseDetailLevel}`)
    if (profile.workingHours) lines.push(`**Working Hours**: ${profile.workingHours}`)

    if (profile.expertise && profile.expertise.length > 0) {
      lines.push(`**Expertise**: ${profile.expertise.join(', ')}`)
    }

    if (profile.learningInterests && profile.learningInterests.length > 0) {
      lines.push(`**Learning Interests**: ${profile.learningInterests.join(', ')}`)
    }

    if (profile.activeProjects && profile.activeProjects.length > 0) {
      lines.push(`**Current Projects**: ${profile.activeProjects.join(', ')}`)
    }

    if (profile.importantContacts && profile.importantContacts.length > 0) {
      const contactStr = profile.importantContacts
        .map((c) => `${c.name}${c.context ? ` (${c.context})` : ''}`)
        .join(', ')
      lines.push(`**Important Contacts**: ${contactStr}`)
    }

    if (profile.notes && profile.notes.length > 0) {
      lines.push(`**Notes**:\n${profile.notes.map((n) => `- ${n}`).join('\n')}`)
    }

    return lines.length > 0 ? lines.join('\n') : 'No profile information yet.'
  }, [profile])

  return {
    profile,
    isLoading,
    saveProfile,
    updateProfileField,
    updateConfidence,
    recordObservation,
    getFormattedProfile,
  }
}
