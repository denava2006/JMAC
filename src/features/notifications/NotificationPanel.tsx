import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import {
  type AppNotification,
  type NotificationPriority,
  fetchNotifications,
  formatBadgeCount,
  markAllRead,
  markRead,
  notificationsQueryKey,
  relativeTime,
  unreadCount,
} from '@/services/notifications'

/** Only urgent and high earn a colour. If every priority is decorated, none of
 *  them reads as urgent. */
const PRIORITY_BADGE: Partial<Record<NotificationPriority, 'error' | 'warning'>> = {
  urgent: 'error',
  high: 'warning',
}

function Row({
  notification,
  onOpen,
}: {
  notification: AppNotification
  onOpen: (notification: AppNotification) => void
}) {
  const badge = PRIORITY_BADGE[notification.priority]

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className={cn(
          'flex w-full flex-col items-start gap-1 rounded-md px-3 py-2.5 text-left transition-colors',
          'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
        )}
      >
        <span className="flex w-full items-center gap-2">
          {/* A dot, not bold text alone: weight is hard to compare at a glance
              across a list, and it is the only unread cue a colour-blind
              reader gets from a badge. */}
          <span
            aria-hidden="true"
            className={cn(
              'size-1.5 shrink-0 rounded-full',
              notification.read ? 'bg-transparent' : 'bg-primary-hover'
            )}
          />
          <span
            className={cn(
              'flex-1 truncate text-sm',
              notification.read ? 'font-normal text-body' : 'font-medium text-heading'
            )}
          >
            {notification.title}
          </span>
          {badge ? (
            <Badge variant={badge} className="shrink-0">
              {notification.priority}
            </Badge>
          ) : null}
        </span>

        {notification.description ? (
          <span className="pl-3.5 text-xs text-body">{notification.description}</span>
        ) : null}

        <span className="pl-3.5 text-xs text-muted-foreground">
          {relativeTime(notification.createdAt)}
          {notification.read ? '' : ' · unread'}
        </span>
      </button>
    </li>
  )
}

export function NotificationPanel() {
  const { session } = useAuth()
  const userId = session?.user.id
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: () => fetchNotifications(userId as string),
    enabled: Boolean(userId),
    staleTime: 30_000,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey })

  const readOne = useMutation({
    mutationFn: (id: string) => markRead(id, userId as string),
    onSuccess: invalidate,
  })

  const readAll = useMutation({
    mutationFn: (ids: string[]) => markAllRead(ids, userId as string),
    onSuccess: invalidate,
  })

  const notifications = data ?? []
  const unread = unreadCount(notifications)
  const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)

  function open(notification: AppNotification) {
    if (!notification.read) readOne.mutate(notification.id)
    if (notification.link) navigate(notification.link)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell aria-hidden="true" />
          {unread > 0 ? (
            <span
              aria-hidden="true"
              className={cn(
                'absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full',
                'bg-error px-1 text-[10px] font-semibold leading-4 text-error-foreground'
              )}
            >
              {formatBadgeCount(unread)}
            </span>
          ) : null}
          {/* The count belongs in the accessible name, not only in a badge a
              screen reader cannot see. */}
          <span className="sr-only">
            Notifications{unread > 0 ? `, ${unread} unread` : ''}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold text-heading">Notifications</p>
          {unread > 0 ? (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              disabled={readAll.isPending}
              onClick={() => readAll.mutate(unreadIds)}
            >
              Mark all read
            </Button>
          ) : null}
        </div>

        <div className="max-h-96 overflow-y-auto p-1">
          {isPending ? (
            <div className="flex flex-col gap-2 p-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : isError ? (
            <ErrorState
              title="Could not load notifications"
              onRetry={() => void refetch()}
              className="border-0 shadow-none"
            />
          ) : notifications.length === 0 ? (
            <EmptyState
              title="You're all caught up"
              description="Approvals, assignments, and alerts appear here."
              className="border-0 shadow-none"
            />
          ) : (
            <ul className="flex flex-col">
              {notifications.map((notification) => (
                <Row key={notification.id} notification={notification} onOpen={open} />
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
