import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { ErrorState } from '@/components/ui/error-state'
import { useAuth } from '@/contexts/AuthContext'
import { InterviewDetailSheet } from '@/features/people/interviews/InterviewDetailSheet'
import { applicationStatusLabel, applicationStatusVariant } from '@/lib/applicationLabels'
import { interviewStageLabel, interviewStatusLabel } from '@/lib/interviewLabels'
import { can } from '@/lib/permissions'
import {
  fetchInterviewQueue,
  fetchInterviewStats,
  getInterviewByStage,
  interviewQueueQueryKey,
  interviewStatsQueryKey,
  scopeInterviewQueue,
  type InterviewApplication,
} from '@/services/interviews'

/** `value` is null when the counts could not be loaded — showing a real zero
 *  there would state something false about the pipeline. */
function StatCard({
  label,
  value,
  variant,
}: {
  label: string
  value: number | null
  variant: 'info' | 'success' | 'error'
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <div className="flex items-center gap-2">
          <Badge variant={variant}>{label}</Badge>
        </div>
        <span className="tabular text-2xl font-semibold text-heading">
          {value === null ? <span className="text-muted-foreground">—</span> : value}
        </span>
      </CardContent>
    </Card>
  )
}

function formatDatetime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function activeInterview(application: InterviewApplication) {
  return getInterviewByStage(application.interviews, 'final') ?? getInterviewByStage(application.interviews, 'initial')
}

function pipelineStage(application: InterviewApplication): string {
  if (application.status === 'hired') return 'Hired'
  if (application.status === 'rejected') return 'Closed'
  const final = getInterviewByStage(application.interviews, 'final')
  if (final) return `${interviewStageLabel('final')} · ${interviewStatusLabel(final.status)}`
  const initial = getInterviewByStage(application.interviews, 'initial')
  if (!initial) return 'Awaiting initial interview'
  if (initial.status === 'passed') return 'Awaiting final interview'
  return `${interviewStageLabel('initial')} · ${interviewStatusLabel(initial.status)}`
}

const COLUMNS: ColumnDef<InterviewApplication>[] = [
  {
    id: 'applicant',
    accessorFn: (row) => `${row.applicantName} ${row.email}`,
    header: 'Applicant',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-heading">{row.original.applicantName}</span>
        <span className="text-xs text-muted-foreground">{row.original.email}</span>
      </div>
    ),
  },
  { accessorKey: 'positionTitle', id: 'position', header: 'Position' },
  {
    accessorKey: 'department',
    id: 'department',
    header: 'Department',
    cell: ({ row }) => row.original.department ?? '—',
  },
  {
    id: 'stage',
    accessorFn: pipelineStage,
    header: 'Current round',
  },
  {
    id: 'scheduled',
    accessorFn: (row) => activeInterview(row)?.scheduledAt ?? '',
    header: 'Scheduled',
    cell: ({ row }) => {
      const interview = activeInterview(row.original)
      return interview ? <span className="tabular text-body">{formatDatetime(interview.scheduledAt)}</span> : '—'
    },
  },
  {
    accessorKey: 'status',
    id: 'status',
    header: 'Application status',
    cell: ({ row }) => (
      <Badge variant={applicationStatusVariant(row.original.status)}>
        {applicationStatusLabel(row.original.status)}
      </Badge>
    ),
  },
]

export function InterviewsPage() {
  const { authorization, profile } = useAuth()
  const canManage = can(authorization, 'interview.manage')
  const profileRole = profile?.role ?? undefined
  const profileId = profile?.id ?? undefined
  const profileEligible = Boolean(profileId && profileRole && ['admin', 'hr_manager', 'hr_staff'].includes(profileRole))
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const queue = useQuery({
    queryKey: interviewQueueQueryKey,
    queryFn: fetchInterviewQueue,
    enabled: canManage && profileEligible,
    staleTime: 30_000,
  })
  const stats = useQuery({
    queryKey: interviewStatsQueryKey,
    queryFn: fetchInterviewStats,
    enabled: canManage && profileEligible,
    staleTime: 30_000,
  })

  const rows = profileEligible ? scopeInterviewQueue(queue.data ?? [], profileRole, profileId) : []
  const selected = selectedId ? rows.find((row) => row.id === selectedId) ?? null : null

  // An open row can leave this queue mid-review: passing the initial round
  // hands the applicant to an HR Manager, which drops it out of HR Staff's
  // scope. Forget the selection rather than keeping an id whose row is gone,
  // which would silently reopen the drawer if that row ever came back.
  useEffect(() => {
    if (selectedId && !selected && queue.data) setSelectedId(null)
  }, [selectedId, selected, queue.data])

  if (!canManage) {
    return <ErrorState title="You do not have permission to manage interviews" />
  }

  if (!profileEligible) {
    return (
      <ErrorState
        title="Interview access is not configured for this account"
        description="Your platform permission and HR profile role do not currently map to the same interview role. Contact an administrator."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Interviews' }]} />

      <div>
        <h1 className="text-2xl font-semibold text-heading">Interviews</h1>
        <p className="mt-1 text-body">Schedule and record the two interview rounds for qualified applicants.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Scheduled" value={stats.isError ? null : stats.data?.scheduledCount ?? 0} variant="info" />
        <StatCard label="Hired" value={stats.isError ? null : stats.data?.hiredCount ?? 0} variant="success" />
        <StatCard label="Rejected" value={stats.isError ? null : stats.data?.rejectedCount ?? 0} variant="error" />
      </div>

      {/* Only the queue failing takes the table away. The counts are a summary
          of it, so losing them must not hide the work itself. */}
      {queue.isError ? (
        <ErrorState
          title="Could not load the interview pipeline"
          onRetry={() => {
            void queue.refetch()
            void stats.refetch()
          }}
        />
      ) : (
        <DataTable
          columns={COLUMNS}
          data={rows}
          loading={queue.isPending}
          searchPlaceholder="Search by applicant, email, position, or department"
          emptyTitle="No applicants in this interview queue"
          emptyDescription="Qualified applicants appear here when they are ready for your interview stage."
          onRowClick={(row) => setSelectedId(row.id)}
        />
      )}

      <InterviewDetailSheet
        application={selected}
        open={selected !== null}
        onOpenChange={(nextOpen) => !nextOpen && setSelectedId(null)}
        canManage={canManage}
        profileId={profileId}
      />
    </div>
  )
}
