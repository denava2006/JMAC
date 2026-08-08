import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { ErrorState } from '@/components/ui/error-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { ApplicantDetailSheet } from '@/features/people/recruitment/ApplicantDetailSheet'
import { applicationStatusLabel, applicationStatusVariant } from '@/lib/applicationLabels'
import { can } from '@/lib/permissions'
import {
  applicationStatsQueryKey,
  applicationsQueryKey,
  fetchApplicationStats,
  fetchApplications,
  type ApplicationRow,
} from '@/services/recruitment'

const STATUS_FILTERS = [
  { value: 'all', label: 'All applications' },
  { value: 'submitted', label: 'New' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'rejected', label: 'Rejected' },
] as const

function StatCard({ label, value, variant }: { label: string; value: number; variant: 'info' | 'success' | 'error' }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <div className="flex items-center gap-2">
          <Badge variant={variant}>{label}</Badge>
        </div>
        <span className="tabular text-2xl font-semibold text-heading">{value}</span>
      </CardContent>
    </Card>
  )
}

export function RecruitmentPage() {
  const { authorization } = useAuth()
  const canScreen = can(authorization, 'applicant.screen')

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selected, setSelected] = useState<ApplicationRow | null>(null)

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: applicationsQueryKey,
    queryFn: fetchApplications,
    staleTime: 30_000,
  })

  const { data: stats } = useQuery({
    queryKey: applicationStatsQueryKey,
    queryFn: fetchApplicationStats,
    staleTime: 30_000,
  })

  const rows = statusFilter === 'all' ? (data ?? []) : (data ?? []).filter((a) => a.status === statusFilter)

  const columns: ColumnDef<ApplicationRow>[] = [
    {
      accessorKey: 'applicantName',
      id: 'applicant',
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
      accessorKey: 'status',
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={applicationStatusVariant(row.original.status)}>
          {applicationStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      id: 'applied',
      header: 'Applied',
      cell: ({ row }) => <span className="tabular text-body">{row.original.createdAt.slice(0, 10)}</span>,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Recruitment' }]} />

      <div>
        <h1 className="text-2xl font-semibold text-heading">Recruitment</h1>
        <p className="mt-1 text-body">
          Applications from the careers site.{' '}
          {canScreen ? 'Open one to review it and qualify or reject the applicant.' : 'Screening is done by an HR Manager.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="New" value={stats?.newCount ?? 0} variant="info" />
        <StatCard label="Qualified" value={stats?.qualifiedCount ?? 0} variant="success" />
        <StatCard label="Rejected" value={stats?.rejectedCount ?? 0} variant="error" />
      </div>

      <div className="flex justify-end">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState title="Could not load applications" onRetry={() => void refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={isPending}
          searchPlaceholder="Search by applicant, position, or department"
          emptyTitle="No applications here"
          emptyDescription="Applications submitted on the careers site appear here for screening."
          onRowClick={(row) => setSelected(row)}
        />
      )}

      <ApplicantDetailSheet
        application={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        canScreen={canScreen}
      />
    </div>
  )
}
