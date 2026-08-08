import { useQuery } from '@tanstack/react-query'
import { Check, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { ErrorState } from '@/components/ui/error-state'
import { useAuth } from '@/contexts/AuthContext'
import { FileLeaveDialog } from '@/features/people/leave/FileLeaveDialog'
import { ReviewLeaveDialog, type ReviewAction } from '@/features/people/leave/ReviewLeaveDialog'
import { can, canAll } from '@/lib/permissions'
import { leaveStatusLabel, leaveStatusVariant } from '@/lib/leaveLabels'
import { fetchLeaveRequests, leaveRequestsQueryKey, type LeaveRequest } from '@/services/leave'

export function LeavePage() {
  const { authorization } = useAuth()
  // Approval is HR-Manager-and-up: the database's protect_leave_approval
  // trigger enforces is_hr_manager_or_admin(), and leave.approve is the
  // matching permission.
  const canReview = can(authorization, 'leave.approve')
  // Filing on behalf of someone is an admin-only corrective action. The
  // protect_leave_request_author trigger rejects a request whose employee_id
  // is not the filer's own, bypassing only for is_admin() — which the database
  // defines as holding user.create AND role.update. Mirroring that exact rule
  // means the button appears only when the insert will actually succeed. The
  // normal path is an employee filing their own leave from self-service.
  const canFileOnBehalf = canAll(authorization, ['user.create', 'role.update'])

  const [fileOpen, setFileOpen] = useState(false)
  const [review, setReview] = useState<{ request: LeaveRequest; action: ReviewAction } | null>(null)

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: leaveRequestsQueryKey,
    queryFn: fetchLeaveRequests,
    staleTime: 30_000,
  })

  const columns: ColumnDef<LeaveRequest>[] = [
    {
      accessorKey: 'employeeName',
      id: 'employee',
      header: 'Employee',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-heading">{row.original.employeeName}</span>
          <span className="tabular text-xs text-muted-foreground">{row.original.employeeNumber}</span>
        </div>
      ),
    },
    { accessorKey: 'leaveType', id: 'type', header: 'Type' },
    {
      accessorKey: 'startDate',
      id: 'dates',
      header: 'Dates',
      cell: ({ row }) => (
        <span className="tabular text-body">
          {row.original.startDate} → {row.original.endDate}
        </span>
      ),
    },
    {
      accessorKey: 'daysRequested',
      id: 'days',
      header: 'Days',
      cell: ({ row }) => <span className="tabular">{row.original.daysRequested}</span>,
    },
    {
      accessorKey: 'status',
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={leaveStatusVariant(row.original.status)}>
          {leaveStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        // Only pending requests can be reviewed, and only by someone who may.
        if (!canReview || row.original.status !== 'pending') return null
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReview({ request: row.original, action: 'approve' })}
            >
              <Check aria-hidden="true" />
              Approve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReview({ request: row.original, action: 'reject' })}
            >
              <X aria-hidden="true" />
              Reject
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Leave' }]} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-heading">Leave</h1>
          <p className="mt-1 text-body">
            Requests across the organisation.{' '}
            {canReview ? 'Approve or reject the pending ones.' : 'Pending requests await a manager.'}
          </p>
        </div>
        {canFileOnBehalf ? (
          <Button onClick={() => setFileOpen(true)}>
            <Plus aria-hidden="true" />
            File leave
          </Button>
        ) : null}
      </div>

      {isError ? (
        <ErrorState
          title="Could not load leave requests"
          onRetry={() => void refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={data ?? []}
          loading={isPending}
          searchPlaceholder="Search by employee or type"
          emptyTitle="No leave requests yet"
          emptyDescription="Filed requests appear here for review."
        />
      )}

      <FileLeaveDialog open={fileOpen} onOpenChange={setFileOpen} />
      <ReviewLeaveDialog
        request={review?.request ?? null}
        action={review?.action ?? 'approve'}
        open={review !== null}
        onOpenChange={(open) => !open && setReview(null)}
      />
    </div>
  )
}
