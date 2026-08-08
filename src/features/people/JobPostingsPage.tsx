import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Send, Trash2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ErrorState } from '@/components/ui/error-state'
import { toast } from '@/components/ui/toast'
import { JobPostingDialog } from '@/features/people/recruitment/JobPostingDialog'
import { isPastClosingDate } from '@/services/careers'
import { jobPostingStatusLabel, jobPostingStatusVariant, jobEmploymentTypeLabel } from '@/lib/jobPostingLabels'
import {
  closeJobPosting,
  deleteJobPosting,
  fetchJobPostings,
  jobPostingsQueryKey,
  publishJobPosting,
  type JobPosting,
} from '@/services/jobPostings'

type Confirm =
  | { kind: 'close'; posting: JobPosting }
  | { kind: 'delete'; posting: JobPosting }
  | null

export function JobPostingsPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<{ posting: JobPosting | null } | null>(null)
  const [confirm, setConfirm] = useState<Confirm>(null)

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: jobPostingsQueryKey,
    queryFn: fetchJobPostings,
    staleTime: 30_000,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: jobPostingsQueryKey })

  const publish = useMutation({
    mutationFn: (id: string) => publishJobPosting(id),
    onSuccess: () => {
      toast.success('Posting published — it is now on the careers page')
      invalidate()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not publish'),
  })

  const closeMutation = useMutation({
    mutationFn: (id: string) => closeJobPosting(id),
    onSuccess: () => {
      toast.success('Posting closed')
      invalidate()
      setConfirm(null)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not close'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteJobPosting(id),
    onSuccess: () => {
      toast.success('Draft deleted')
      invalidate()
      setConfirm(null)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not delete'),
  })

  const columns: ColumnDef<JobPosting>[] = [
    {
      accessorKey: 'title',
      id: 'title',
      header: 'Position',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-heading">{row.original.title}</span>
          <span className="text-xs text-muted-foreground">{row.original.department ?? '—'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'employmentType',
      id: 'type',
      header: 'Type',
      cell: ({ row }) => jobEmploymentTypeLabel(row.original.employmentType),
    },
    {
      accessorKey: 'vacancies',
      id: 'vacancies',
      header: 'Vacancies',
      cell: ({ row }) => <span className="tabular">{row.original.vacancies}</span>,
    },
    {
      accessorKey: 'closingDate',
      id: 'closes',
      header: 'Closes',
      cell: ({ row }) => <span className="tabular text-body">{row.original.closingDate ?? '—'}</span>,
    },
    {
      accessorKey: 'status',
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={jobPostingStatusVariant(row.original.status)}>
          {jobPostingStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const posting = row.original
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditing({ posting })}>
              <Pencil aria-hidden="true" />
              <span className="sr-only">Edit {posting.title}</span>
            </Button>
            {posting.status === 'draft' ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={publish.isPending}
                onClick={() => {
                  // A draft can carry a closing date that has since passed —
                  // the calendar only guarded the value at entry time.
                  // Publishing it would put an already-expired posting live, so
                  // block it here and point HR back to the edit form.
                  if (isPastClosingDate(posting.closingDate)) {
                    toast.error('This closing date has passed. Edit the posting before publishing.')
                    return
                  }
                  publish.mutate(posting.id)
                }}
              >
                <Send aria-hidden="true" />
                Publish
              </Button>
            ) : null}
            {posting.status === 'open' ? (
              <Button variant="ghost" size="sm" onClick={() => setConfirm({ kind: 'close', posting })}>
                <XCircle aria-hidden="true" />
                Close
              </Button>
            ) : null}
            {posting.status === 'draft' ? (
              <Button variant="ghost" size="sm" onClick={() => setConfirm({ kind: 'delete', posting })}>
                <Trash2 aria-hidden="true" />
                <span className="sr-only">Delete {posting.title}</span>
              </Button>
            ) : null}
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Job Posting' }]} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-heading">Job Posting</h1>
          <p className="mt-1 text-body">
            Draft, publish, and close roles. Published postings appear on the public careers page.
          </p>
        </div>
        <Button onClick={() => setEditing({ posting: null })}>
          <Plus aria-hidden="true" />
          New posting
        </Button>
      </div>

      {isError ? (
        <ErrorState title="Could not load job postings" onRetry={() => void refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={data ?? []}
          loading={isPending}
          searchPlaceholder="Search by position"
          emptyTitle="No job postings yet"
          emptyDescription="Create a draft, then publish it when it is ready."
        />
      )}

      <JobPostingDialog
        posting={editing?.posting ?? null}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />

      <Dialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.kind === 'delete' ? 'Delete this draft?' : 'Close this posting?'}
            </DialogTitle>
            <DialogDescription>
              {confirm?.kind === 'delete'
                ? `"${confirm.posting.title}" will be removed. This cannot be undone.`
                : confirm
                  ? `"${confirm.posting.title}" will stop accepting applications and leave the public careers page.`
                  : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={closeMutation.isPending || deleteMutation.isPending}
              onClick={() => {
                if (!confirm) return
                if (confirm.kind === 'delete') deleteMutation.mutate(confirm.posting.id)
                else closeMutation.mutate(confirm.posting.id)
              }}
            >
              {confirm?.kind === 'delete' ? 'Delete draft' : 'Close posting'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
