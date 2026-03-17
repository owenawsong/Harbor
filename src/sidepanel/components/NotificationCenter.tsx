import React, { useState, useEffect } from 'react'
import { Bell, X, Check, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import type { HarborNotification, NotificationLevel } from '../../shared/types'

const STORAGE_KEY = 'harbor_notifications'

function uid(): string {
  return Math.random().toString(36).slice(2, 11)
}

const LEVEL_STYLES: Record<NotificationLevel, {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  color: string
  bg: string
  border: string
}> = {
  info:    { icon: Info,          color: '#4e8ea8', bg: 'rgb(var(--harbor-accent-light))', border: 'rgb(var(--harbor-accent) / 0.3)' },
  success: { icon: CheckCircle,   color: '#22c55e', bg: 'rgb(34 197 94 / 0.08)',          border: 'rgb(34 197 94 / 0.25)' },
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgb(245 158 11 / 0.08)',          border: 'rgb(245 158 11 / 0.25)' },
  error:   { icon: AlertCircle,   color: '#ef4444', bg: 'rgb(239 68 68 / 0.08)',           border: 'rgb(239 68 68 / 0.25)' },
}

// ─── Notification Bell Button ─────────────────────────────────────────────────

interface BellProps {
  onClick: () => void
}

export function NotificationBell({ onClick }: BellProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const checkUnread = () => {
      chrome.storage.local.get(STORAGE_KEY, (data) => {
        const notifs: HarborNotification[] = data[STORAGE_KEY] ?? []
        setUnreadCount(notifs.filter((n) => !n.isRead).length)
      })
    }
    checkUnread()
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes[STORAGE_KEY]) checkUnread()
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  return (
    <button onClick={onClick} className="icon-btn relative" title="Notifications">
      <Bell size={15} />
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 rounded-full flex items-center justify-center text-[9px] font-semibold px-0.5"
          style={{ background: 'rgb(var(--harbor-accent))', color: 'white' }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}

// ─── Notification Center Panel ────────────────────────────────────────────────

interface PanelProps {
  onClose: () => void
}

export function NotificationCenter({ onClose }: PanelProps) {
  const [notifications, setNotifications] = useState<HarborNotification[]>([])

  const load = () => {
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      const notifs: HarborNotification[] = data[STORAGE_KEY] ?? []
      setNotifications(notifs.sort((a, b) => b.timestamp - a.timestamp))
    })
  }

  useEffect(() => {
    load()
  }, [])

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }))
    setNotifications(updated)
    chrome.storage.local.set({ [STORAGE_KEY]: updated })
  }

  const dismiss = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id)
    setNotifications(updated)
    chrome.storage.local.set({ [STORAGE_KEY]: updated })
  }

  const dismissAll = () => {
    setNotifications([])
    chrome.storage.local.set({ [STORAGE_KEY]: [] })
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div
      className="absolute top-full right-0 mt-1 w-72 rounded-2xl shadow-xl z-40 overflow-hidden animate-slide-down"
      style={{
        background: 'rgb(var(--harbor-surface))',
        border: '1px solid rgb(var(--harbor-border))',
        boxShadow: '0 8px 32px rgb(0 0 0 / 0.18)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 border-b"
        style={{ borderColor: 'rgb(var(--harbor-border))' }}
      >
        <div className="flex items-center gap-1.5">
          <Bell size={13} style={{ color: 'rgb(var(--harbor-accent))' }} />
          <span className="text-xs font-semibold" style={{ color: 'rgb(var(--harbor-text))' }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgb(var(--harbor-accent))', color: 'white' }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ color: 'rgb(var(--harbor-accent))' }}
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="icon-btn p-0.5">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-64 overflow-y-auto harbor-scroll">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Bell size={24} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
            <p className="text-xs" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
              All caught up!
            </p>
          </div>
        ) : (
          <div className="py-1.5 px-2 flex flex-col gap-1">
            {notifications.map((notif) => (
              <NotifCard
                key={notif.id}
                notif={notif}
                onDismiss={() => dismiss(notif.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div
          className="px-3.5 py-2 border-t"
          style={{ borderColor: 'rgb(var(--harbor-border))', background: 'rgb(var(--harbor-surface-2))' }}
        >
          <button
            onClick={dismissAll}
            className="text-[10px] w-full text-center"
            style={{ color: 'rgb(var(--harbor-text-faint))' }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}

function NotifCard({ notif, onDismiss }: { notif: HarborNotification; onDismiss: () => void }) {
  const style = LEVEL_STYLES[notif.level]
  const Icon = style.icon

  return (
    <div
      className="flex items-start gap-2.5 p-2.5 rounded-xl border group"
      style={{
        background: notif.isRead ? 'transparent' : style.bg,
        borderColor: notif.isRead ? 'transparent' : style.border,
        opacity: notif.isRead ? 0.65 : 1,
      }}
    >
      <Icon size={13} style={{ color: style.color, flexShrink: 0, marginTop: 1 }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-snug" style={{ color: 'rgb(var(--harbor-text))' }}>
          {notif.title}
        </p>
        {notif.body && (
          <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'rgb(var(--harbor-text-muted))' }}>
            {notif.body}
          </p>
        )}
        <p className="text-[10px] mt-1" style={{ color: 'rgb(var(--harbor-text-faint))' }}>
          {formatTime(notif.timestamp)}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <X size={11} style={{ color: 'rgb(var(--harbor-text-faint))' }} />
      </button>
    </div>
  )
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString()
}

// ─── Utility: push a notification ────────────────────────────────────────────

export async function pushNotification(notif: Omit<HarborNotification, 'id' | 'timestamp' | 'isRead'>) {
  const { [STORAGE_KEY]: existing = [] } = await chrome.storage.local.get(STORAGE_KEY)
  const updated = [
    { ...notif, id: uid(), timestamp: Date.now(), isRead: false },
    ...(existing as HarborNotification[]),
  ].slice(0, 50) // keep last 50
  await chrome.storage.local.set({ [STORAGE_KEY]: updated })
}
