import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { ErrorState } from '@/components/ui/error-state'
import { useAuth } from '@/contexts/AuthContext'
import { DeployApplicantDialog } from '@/features/people/deployment/DeployApplicantDialog'
import { can } from '@/lib/permissions'
import {
  deploymentQueueQueryKey,
  fetchDeploymentQueue,
  type DeployableApplication,
} from '@/services/deployment'

export function DeploymentPage() {
  const { authorization } = useAuth()
  // Creating the deployment record is the same authority as creating the
  // employee it leads to; deployment.view alone is a read of the queue.
  const canDeploy = can(authorization, 'employee.create')

  const [selected, setSelected] = useState<DeployableApplication | null>(null)

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: deploymentQueueQueryKey,
    queryFn: fetchDeploymentQueue,
    staleTime: 30_000,
  })

  const rows = data ?? []
  const awaiting = rows.filter((row) => row.deployedAt === null && row.contractSigned).length

  const columns: ColumnDef<DeployableApplication>[] = [
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
      accessorKey: 'startDate',
      id: 'start',
      header: 'Start date',
      cell: ({ row }) => <span className="tabular text-body">{row.original.startDate ?? '—'}</span>,
    },
    {
      id: 'status',
      accessorFn: (row) =>
        row.deployedAt ? 'Deployed' : row.contractSigned ? 'Ready to deploy' : 'Awaiting signed contract',
      header: 'Status',
      cell: ({ row }) =>
        row.original.deployedAt ? (
          <Badge variant="success">Deployed {row.original.deployedAt}</Badge>
        ) : row.original.contractSigned ? (
          <Badge variant="info">Ready to deploy</Badge>
        ) : (
          <Badge variant="warning">Awaiting signed contract</Badge>
        ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        // The database refuses a deployment without a signed contract, so the
        // action only appears once there is one.
        if (!canDeploy || row.original.deployedAt || !row.original.contractSigned) return null
        return (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setSelected(row.original)}>
              Deploy
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Deployment' }]} />

      <div>
        <h1 className="text-2xl font-semibold text-heading">Deployment</h1>
        <p className="mt-1 text-body">
          Applicants who accepted their offer and signed their contract.{' '}
          {awaiting > 0 ? `${awaiting} ready to deploy.` : 'Nobody is waiting to be deployed.'}
        </p>
      </div>

      {isError ? (
        <ErrorState title="Could not load the deployment queue" onRetry={() => void refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={isPending}
          searchPlaceholder="Search by applicant, position, or department"
          emptyTitle="Nobody is at the deployment stage"
          emptyDescription="Applicants appear here once they accept a job offer. Deployment unlocks when the signed contract is recorded."
        />
      )}

      <DeployApplicantDialog
        application={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  )
}
