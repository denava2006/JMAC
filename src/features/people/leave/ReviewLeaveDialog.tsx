import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { LEAVE_REJECTION_PRESETS } from '@/lib/leaveLabels'
import { cn } from '@/lib/utils'
import {
  approveLeaveRequest,
  leaveRequestsQueryKey,
  rejectLeaveRequest,
  type LeaveRequest,
} from '@/services/leave'

export type ReviewAction = 'approve' | 'reject'

export function ReviewLeaveDialog({
  request,
  action,
  open,
  onOpenChange,
}: {
  request: LeaveRequest | null
  action: ReviewAction
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) setReason('')
  }, [open, request?.id])

  const approving = action === 'approve'

  const mutation = useMutation({
    mutationFn: async () => {
      if (!request) return
      if (approving) return approveLeaveRequest(request.id)
      const trimmed = reason.trim()
      if (!trimmed) throw new Error('Give a reason for rejecting this request.')
      return rejectLeaveRequest(request.id, trimmed)
    },
    onSuccess: () => {
      toast.success(approving ? 'Leave approved' : 'Leave rejected')
      queryClient.invalidateQueries({ queryKey: leaveRequestsQueryKey })
      onOpenChange(false)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not review the request'),
  })

  if (!request) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{approving ? 'Approve leave' : 'Reject leave'}</DialogTitle>
          <DialogDescription>
            {request.employeeName} · {request.leaveType} · {request.startDate} to {request.endDate} (
            {request.daysRequested} {request.daysRequested === 1 ? 'day' : 'days'})
          </DialogDescription>
        </DialogHeader>

        {approving ? (
          <p className="text-sm text-body">
            Approving records you as the reviewer and marks the request approved.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {LEAVE_REJECTION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset === 'Other' ? '' : preset)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                    reason === preset
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-body hover:bg-muted'
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rejection-reason" required>
                Reason
              </Label>
              <Textarea
                id="rejection-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="The employee sees this reason."
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={approving ? 'primary' : 'destructive'}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Saving…' : approving ? 'Approve' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
