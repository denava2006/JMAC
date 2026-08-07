import { describe, expect, it } from 'vitest'
import {
  type AppNotification,
  formatBadgeCount,
  relativeTime,
  unreadCount,
} from '@/services/notifications'

function notification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: crypto.randomUUID(),
    title: 'Leave request awaiting review',
    description: null,
    priority: 'normal',
    link: null,
    createdAt: new Date().toISOString(),
    read: false,
    ...overrides,
  }
}

describe('unreadCount', () => {
  it('counts only the unread ones', () => {
    expect(
      unreadCount([
        notification({ read: false }),
        notification({ read: true }),
        notification({ read: false }),
      ])
    ).toBe(2)
  })

  it('is 0 for an empty inbox', () => {
    expect(unreadCount([])).toBe(0)
  })

  it('is 0 when everything is read', () => {
    expect(unreadCount([notification({ read: true }), notification({ read: true })])).toBe(0)
  })
})

describe('formatBadgeCount', () => {
  it('shows the number up to the cap', () => {
    expect(formatBadgeCount(1)).toBe('1')
    expect(formatBadgeCount(9)).toBe('9')
  })

  // A neglected inbox must not stretch the header badge to three digits.
  it('caps above the maximum', () => {
    expect(formatBadgeCount(10)).toBe('9+')
    expect(formatBadgeCount(250)).toBe('9+')
  })

  it('honours a custom cap', () => {
    expect(formatBadgeCount(120, 99)).toBe('99+')
  })
})

describe('relativeTime', () => {
  const now = new Date('2026-08-07T12:00:00Z')

  it('describes seconds ago', () => {
    expect(relativeTime('2026-08-07T11:59:30Z', now)).toMatch(/30 seconds ago|now/)
  })

  it('picks minutes over seconds', () => {
    expect(relativeTime('2026-08-07T11:45:00Z', now)).toBe('15 minutes ago')
  })

  it('picks hours over minutes', () => {
    expect(relativeTime('2026-08-07T09:00:00Z', now)).toBe('3 hours ago')
  })

  it('picks days over hours', () => {
    expect(relativeTime('2026-08-05T12:00:00Z', now)).toBe('2 days ago')
  })

  // The reason the unit ladder exists: "2678400 seconds ago" is technically
  // correct and useless.
  it('picks months over days', () => {
    expect(relativeTime('2026-06-07T12:00:00Z', now)).toBe('2 months ago')
  })

  it('picks years over months', () => {
    expect(relativeTime('2024-08-07T12:00:00Z', now)).toBe('2 years ago')
  })
})
