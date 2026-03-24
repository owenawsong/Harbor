import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Edit2, Save, X } from 'lucide-react'
import { useUserProfile } from '../hooks/useUserProfile'
import type { UserProfile } from '../../shared/types'

interface Props {
  onBack: () => void
}

export default function UserProfilePanel({ onBack }: Props) {
  const { t } = useTranslation()
  const { profile, isLoading, saveProfile, updateProfileField } = useUserProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile)

  const handleEdit = (field: keyof Omit<UserProfile, 'id' | 'lastUpdated' | 'confidence'>, value: any) => {
    setEditedProfile({ ...editedProfile, [field]: value })
  }

  const handleSave = () => {
    saveProfile(editedProfile)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-sm" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
            Loading profile...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'rgb(var(--harbor-border))' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 hover:bg-[rgb(var(--harbor-surface-2))] rounded transition-colors"
          >
            <ArrowLeft size={18} style={{ color: 'rgb(var(--harbor-text))' }} />
          </button>
          <h2 className="text-sm font-semibold" style={{ color: 'rgb(var(--harbor-text))' }}>
            User Profile
          </h2>
        </div>
        <button
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: 'rgb(var(--harbor-accent))',
            color: 'white',
          }}
        >
          {isEditing ? (
            <>
              <Save size={13} />
              Save
            </>
          ) : (
            <>
              <Edit2 size={13} />
              Edit
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isEditing && (
          <button
            onClick={handleCancel}
            className="w-full px-3 py-2 rounded-lg border text-xs font-medium transition-colors"
            style={{
              borderColor: 'rgb(var(--harbor-border))',
              color: 'rgb(var(--harbor-text-muted))',
            }}
          >
            <X size={13} className="inline mr-1" />
            Cancel
          </button>
        )}

        {/* Identity Section */}
        <div
          className="p-3 rounded-lg border"
          style={{
            borderColor: 'rgb(var(--harbor-border))',
            background: 'rgb(var(--harbor-surface-2))',
          }}
        >
          <h3 className="text-xs font-semibold mb-3" style={{ color: 'rgb(var(--harbor-accent))' }}>
            Identity
          </h3>
          <div className="space-y-2.5">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.name || ''}
                  onChange={(e) => handleEdit('name', e.target.value || undefined)}
                  placeholder="Your name"
                  className="w-full px-2.5 py-1.5 rounded text-xs border"
                  style={{
                    borderColor: 'rgb(var(--harbor-border))',
                    background: 'rgb(var(--harbor-surface))',
                    color: 'rgb(var(--harbor-text))',
                  }}
                />
              ) : (
                <p className="text-xs" style={{ color: 'rgb(var(--harbor-text))' }}>
                  {profile.name || 'Not set'}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                Role/Title
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.role || ''}
                  onChange={(e) => handleEdit('role', e.target.value || undefined)}
                  placeholder="e.g., Software Engineer"
                  className="w-full px-2.5 py-1.5 rounded text-xs border"
                  style={{
                    borderColor: 'rgb(var(--harbor-border))',
                    background: 'rgb(var(--harbor-surface))',
                    color: 'rgb(var(--harbor-text))',
                  }}
                />
              ) : (
                <p className="text-xs" style={{ color: 'rgb(var(--harbor-text))' }}>
                  {profile.role || 'Not set'}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                Timezone
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.timezone || ''}
                  onChange={(e) => handleEdit('timezone', e.target.value || undefined)}
                  placeholder="e.g., EST, PST"
                  className="w-full px-2.5 py-1.5 rounded text-xs border"
                  style={{
                    borderColor: 'rgb(var(--harbor-border))',
                    background: 'rgb(var(--harbor-surface))',
                    color: 'rgb(var(--harbor-text))',
                  }}
                />
              ) : (
                <p className="text-xs" style={{ color: 'rgb(var(--harbor-text))' }}>
                  {profile.timezone || 'Not set'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div
          className="p-3 rounded-lg border"
          style={{
            borderColor: 'rgb(var(--harbor-border))',
            background: 'rgb(var(--harbor-surface-2))',
          }}
        >
          <h3 className="text-xs font-semibold mb-3" style={{ color: 'rgb(var(--harbor-accent))' }}>
            Preferences
          </h3>
          <div className="space-y-2.5">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                Communication Style
              </label>
              {isEditing ? (
                <select
                  value={editedProfile.communicationStyle || 'detailed'}
                  onChange={(e) => handleEdit('communicationStyle', e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded text-xs border"
                  style={{
                    borderColor: 'rgb(var(--harbor-border))',
                    background: 'rgb(var(--harbor-surface))',
                    color: 'rgb(var(--harbor-text))',
                  }}
                >
                  <option value="concise">Concise</option>
                  <option value="detailed">Detailed</option>
                  <option value="technical">Technical</option>
                  <option value="casual">Casual</option>
                </select>
              ) : (
                <p className="text-xs" style={{ color: 'rgb(var(--harbor-text))' }}>
                  {profile.communicationStyle || 'detailed'}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                Response Detail Level
              </label>
              {isEditing ? (
                <select
                  value={editedProfile.responseDetailLevel || 'moderate'}
                  onChange={(e) => handleEdit('responseDetailLevel', e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded text-xs border"
                  style={{
                    borderColor: 'rgb(var(--harbor-border))',
                    background: 'rgb(var(--harbor-surface))',
                    color: 'rgb(var(--harbor-text))',
                  }}
                >
                  <option value="brief">Brief</option>
                  <option value="moderate">Moderate</option>
                  <option value="detailed">Detailed</option>
                </select>
              ) : (
                <p className="text-xs" style={{ color: 'rgb(var(--harbor-text))' }}>
                  {profile.responseDetailLevel || 'moderate'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div
          className="p-3 rounded-lg border"
          style={{
            borderColor: 'rgb(var(--harbor-border))',
            background: 'rgb(var(--harbor-surface-2))',
          }}
        >
          <h3 className="text-xs font-semibold mb-3" style={{ color: 'rgb(var(--harbor-accent))' }}>
            Skills & Interests
          </h3>
          <div className="space-y-2.5">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                Expertise
              </label>
              {isEditing ? (
                <textarea
                  value={(editedProfile.expertise || []).join(', ')}
                  onChange={(e) => handleEdit('expertise', e.target.value ? e.target.value.split(',').map((s) => s.trim()) : [])}
                  placeholder="e.g., React, Python, DevOps"
                  className="w-full px-2.5 py-1.5 rounded text-xs border resize-none"
                  rows={2}
                  style={{
                    borderColor: 'rgb(var(--harbor-border))',
                    background: 'rgb(var(--harbor-surface))',
                    color: 'rgb(var(--harbor-text))',
                  }}
                />
              ) : (
                <p className="text-xs" style={{ color: 'rgb(var(--harbor-text))' }}>
                  {profile.expertise?.join(', ') || 'Not set'}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
                Learning Interests
              </label>
              {isEditing ? (
                <textarea
                  value={(editedProfile.learningInterests || []).join(', ')}
                  onChange={(e) => handleEdit('learningInterests', e.target.value ? e.target.value.split(',').map((s) => s.trim()) : [])}
                  placeholder="e.g., Machine Learning, Kubernetes"
                  className="w-full px-2.5 py-1.5 rounded text-xs border resize-none"
                  rows={2}
                  style={{
                    borderColor: 'rgb(var(--harbor-border))',
                    background: 'rgb(var(--harbor-surface))',
                    color: 'rgb(var(--harbor-text))',
                  }}
                />
              ) : (
                <p className="text-xs" style={{ color: 'rgb(var(--harbor-text))' }}>
                  {profile.learningInterests?.join(', ') || 'Not set'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div
          className="p-3 rounded-lg border"
          style={{
            borderColor: 'rgb(var(--harbor-border))',
            background: 'rgb(var(--harbor-surface-2))',
          }}
        >
          <h3 className="text-xs font-semibold mb-3" style={{ color: 'rgb(var(--harbor-accent))' }}>
            Notes
          </h3>
          {isEditing ? (
            <textarea
              value={(editedProfile.notes || []).join('\n')}
              onChange={(e) => handleEdit('notes', e.target.value ? e.target.value.split('\n').filter((n) => n.trim()) : [])}
              placeholder="Important notes and observations"
              className="w-full px-2.5 py-1.5 rounded text-xs border resize-none"
              rows={4}
              style={{
                borderColor: 'rgb(var(--harbor-border))',
                background: 'rgb(var(--harbor-surface))',
                color: 'rgb(var(--harbor-text))',
              }}
            />
          ) : (
            <div className="text-xs" style={{ color: 'rgb(var(--harbor-text))' }}>
              {profile.notes && profile.notes.length > 0 ? (
                <ul className="space-y-1">
                  {profile.notes.map((note, i) => (
                    <li key={i}>• {note}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'rgb(var(--harbor-text-faint))' }}>No notes yet</p>
              )}
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="text-xs text-center" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          Last updated: {new Date(profile.lastUpdated).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}
