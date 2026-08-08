import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { ErrorState } from '@/components/ui/error-state'
import { EmployeeDetailSheet } from '@/features/people/EmployeeDetailSheet'
import {
  employmentStatusLabel,
  employmentStatusVariant,
  employmentTypeLabel,
} from '@/lib/employeeLabels'
import { employeesQueryKey, fetchEmployees, type EmployeeListRow } from '@/services/employees'

const columns: ColumnDef<EmployeeListRow>[] = [
  {
    accessorKey: 'employeeNumber',
    id: 'employee no.',
    header: 'Employee no.',
    cell: ({ row }) => <span className="tabular text-body">{row.original.employeeNumber}</span>,
  },
  {
    accessorKey: 'fullName',
    id: 'name',
    header: 'Name',
    cell: ({ row }) => <span className="font-medium text-heading">{row.original.fullName}</span>,
  },
  { accessorKey: 'positionTitle', id: 'position', header: 'Position' },
  {
    accessorKey: 'department',
    id: 'department',
    header: 'Department',
    cell: ({ row }) => row.original.department ?? '—',
  },
  {
    accessorKey: 'employmentType',
    id: 'type',
    header: 'Type',
    cell: ({ row }) => employmentTypeLabel(row.original.employmentType),
  },
  {
    accessorKey: 'employmentStatus',
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={employmentStatusVariant(row.original.employmentStatus)}>
        {employmentStatusLabel(row.original.employmentStatus)}
      </Badge>
    ),
  },
]

export function EmployeesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: employeesQueryKey,
    queryFn: fetchEmployees,
    staleTime: 60_000,
  })

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Employees' }]} />

      <div>
        <h1 className="text-2xl font-semibold text-heading">Employees</h1>
        <p className="mt-1 text-body">
          Everyone on the books. Select a row to see the full record.
        </p>
      </div>

      {isError ? (
        <ErrorState
          title="Could not load employees"
          description="The directory is temporarily unavailable."
          onRetry={() => void refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          data={data ?? []}
          loading={isPending}
          searchPlaceholder="Search by name, number, or position"
          emptyTitle="No employees yet"
          emptyDescription="Hired applicants become employee records here."
          onRowClick={(row) => setSelectedId(row.id)}
        />
      )}

      <EmployeeDetailSheet
        employeeId={selectedId}
        open={selectedId !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  )
}
