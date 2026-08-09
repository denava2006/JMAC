import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/AuthContext'
import { can } from '@/lib/permissions'
import {
  createEmployeeFromApplication,
  employeesQueryKey,
  fetchPendingEmployees,
  pendingEmployeesQueryKey,
  type PendingEmployee,
} from '@/services/employees'

function PendingRow({ pending, canCreate }: { pending: PendingEmployee; canCreate: boolean }) {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: () => createEmployeeFromApplication(pending.applicationId),
    onSuccess: () => {
      toast.success(`${pending.applicantName} added to Employees`)
      queryClient.invalidateQueries({ queryKey: pendingEmployeesQueryKey })
      queryClient.invalidateQueries({ queryKey: employeesQueryKey })
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Could not create the employee record'),
  })

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="font-medium text-heading">{pending.applicantName}</p>
        <p className="text-xs text-muted-foreground">
          {pending.positionTitle}
          {pending.department ? ` · ${pending.department}` : ''} · {pending.email}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {pending.deploymentDate ? (
          <span className="tabular text-xs text-muted-foreground">Deployed {pending.deploymentDate}</span>
        ) : null}
        {canCreate ? (
          <Button type="button" size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
            <UserPlus aria-hidden="true" />
            {create.isPending ? 'Creating…' : 'Create employee record'}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Deployed applicants who do not have an employee record yet.
 *
 * The record is built server-side from the applicant, the accepted offer and the
 * deployment, so there is nothing to retype. Creating it is idempotent — the
 * unique `employees.application_id` means one application can only ever become
 * one employee.
 *
 * Creating the employee does not create a POS login; user, role and store
 * membership remain separate.
 */
export function PendingEmployees() {
  const { authorization } = useAuth()
  const canCreate = can(authorization, 'employee.create')

  const { data } = useQuery({
    queryKey: pendingEmployeesQueryKey,
    queryFn: fetchPendingEmployees,
    staleTime: 30_000,
  })

  const pending = data ?? []
  if (pending.length === 0) return null

  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-heading">Awaiting employee record</h2>
          <Badge variant="warning">{pending.length}</Badge>
        </div>
        <p className="mb-2 text-sm text-body">
          These applicants have been deployed. Creating the record copies their details from the
          application and the accepted offer.
        </p>
        {pending.map((row) => (
          <PendingRow key={row.applicationId} pending={row} canCreate={canCreate} />
        ))}
      </CardContent>
    </Card>
  )
}
