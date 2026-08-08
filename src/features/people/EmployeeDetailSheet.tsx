import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { ErrorState } from '@/components/ui/error-state'
import { Loader } from '@/components/ui/loader'
import {
  employmentStatusLabel,
  employmentStatusVariant,
  employmentTypeLabel,
} from '@/lib/employeeLabels'
import { employeeQueryKey, fetchEmployee } from '@/services/employees'

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-heading">{value || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <dl className="grid grid-cols-2 gap-4">{children}</dl>
    </section>
  )
}

export interface EmployeeDetailSheetProps {
  employeeId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmployeeDetailSheet({ employeeId, open, onOpenChange }: EmployeeDetailSheetProps) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: employeeQueryKey(employeeId ?? 'none'),
    queryFn: () => fetchEmployee(employeeId as string),
    enabled: open && employeeId !== null,
  })

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <DrawerHeader className="p-0">
          {data ? (
            <>
              <div className="flex items-center gap-3">
                <DrawerTitle>{data.fullName}</DrawerTitle>
                <Badge variant={employmentStatusVariant(data.employmentStatus)}>
                  {employmentStatusLabel(data.employmentStatus)}
                </Badge>
              </div>
              <DrawerDescription>
                {data.positionTitle}
                {data.department ? ` · ${data.department}` : ''}
              </DrawerDescription>
            </>
          ) : (
            <DrawerTitle>Employee</DrawerTitle>
          )}
        </DrawerHeader>

        {isPending && employeeId ? (
          <div className="grid place-items-center py-16">
            <Loader label="Loading employee" />
          </div>
        ) : isError ? (
          <ErrorState
            title="Could not load this employee"
            onRetry={() => void refetch()}
            className="mt-6"
          />
        ) : data ? (
          <div className="mt-6 flex flex-col gap-6">
            <Section title="Employment">
              <Field label="Employee no." value={<span className="tabular">{data.employeeNumber}</span>} />
              <Field label="Branch" value={data.branch} />
              <Field label="Type" value={employmentTypeLabel(data.employmentType)} />
              <Field label="Hire date" value={data.hireDate} />
              {data.separationDate ? <Field label="Separation date" value={data.separationDate} /> : null}
            </Section>

            <Section title="Contact">
              <Field label="Work email" value={data.workEmail} />
              <Field label="Personal email" value={data.personalEmail} />
              <Field label="Phone" value={data.phone} />
            </Section>

            <Section title="Personal">
              <Field label="Date of birth" value={data.dateOfBirth} />
              <Field label="Gender" value={data.gender} />
              <Field label="Civil status" value={data.civilStatus} />
              <Field label="Nationality" value={data.nationality} />
            </Section>

            <Section title="Address">
              <Field label="Street" value={data.address} />
              <Field label="Barangay" value={data.barangay} />
              <Field label="City" value={data.city} />
              <Field label="Province" value={data.province} />
            </Section>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}
