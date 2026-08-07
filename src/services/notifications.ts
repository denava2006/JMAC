import { supabase } from '@/lib/supabase'

/**
 * Notifications.
 *
 * The schema enforces that a notification is either addressed to one person
 * (`user_id`) or broadcast to everyone holding a permission
 * (`audience_permission`) — never both, and never neither. RLS matches:
 *
 *   user_id = auth.uid() OR (audience_permission IS NOT NULL
 *                            AND has_permission(audience_permission))
 *
 * So the client never filters by audience. Anything it can read is already
 * addressed to the person reading it, and a client-side filter would be a
 * weaker second copy of that rule.
 *
 * Read state lives in `notification_reads`, one row per person per
 * notification. Unread is the absence of a row, which means marking read is an
 * insert rather than a mutation of shared state — two people reading the same
 * broadcast cannot overwrite each other.
 */

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface AppNotification {
  id: string
  title: string
  description: string | null
  priority: NotificationPriority
  link: string | null
  createdAt: string
  read: boolean
}

const PAGE_SIZE = 50

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  // Two queries rather than an embedded join: `notification_reads` is already
  // restricted to the caller's own rows by RLS, so fetching it whole is both
  // correct and smaller than teaching PostgREST to embed a self-filtered
  // relation.
  const [notifications, reads] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, title, description, priority, link, created_at')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE),
    supabase.from('notification_reads').select('notification_id').eq('user_id', userId),
  ])

  if (notifications.error) throw new Error(notifications.error.message)
  if (reads.error) throw new Error(reads.error.message)

  const readIds = new Set((reads.data ?? []).map((row) => row.notification_id))

  return (notifications.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    priority: (row.priority ?? 'normal') as NotificationPriority,
    link: row.link,
    createdAt: row.created_at,
    read: readIds.has(row.id),
  }))
}

export async function markRead(notificationId: string, userId: string): Promise<void> {
  // Upsert, not insert: opening the panel twice must not fail on a duplicate
  // key, and re-reading something is not an error.
  const { error } = await supabase
    .from('notification_reads')
    .upsert(
      { notification_id: notificationId, user_id: userId, read_at: new Date().toISOString() },
      { onConflict: 'notification_id,user_id' }
    )
  if (error) throw new Error(error.message)
}

export async function markAllRead(ids: string[], userId: string): Promise<void> {
  if (ids.length === 0) return
  const readAt = new Date().toISOString()
  const { error } = await supabase
    .from('notification_reads')
    .upsert(
      ids.map((notification_id) => ({ notification_id, user_id: userId, read_at: readAt })),
      { onConflict: 'notification_id,user_id' }
    )
  if (error) throw new Error(error.message)
}

export function unreadCount(notifications: AppNotification[]): number {
  return notifications.filter((notification) => !notification.read).length
}

/** Caps the badge so a neglected inbox does not stretch the header. */
export function formatBadgeCount(count: number, max = 9): string {
  return count > max ? `${max}+` : String(count)
}

/** Compact relative time. Intl.RelativeTimeFormat gives the wording; picking
 *  the unit is ours, because "2678400 seconds ago" is technically correct and
 *  useless. */
export function relativeTime(iso: string, now = new Date()): string {
  const then = new Date(iso)
  const seconds = Math.round((then.getTime() - now.getTime()) / 1000)
  const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ]

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit)
  }
  return format.format(Math.round(seconds), 'second')
}

export const notificationsQueryKey = ['notifications'] as const
