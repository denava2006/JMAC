import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { inclusiveDays } from '@/lib/leaveLabels'
import {
  employeeOptionsQueryKey,
  fetchEmployeeOptions,
  fetchLeaveTypes,
  fileLeaveRequest,
  leaveRequestsQueryKey,
  leaveTypesQueryKey,
} from '@/services/leave'

const schema = z
  .object({
    employeeId: z.string().min(1, 'Choose an employee.'),
    leaveTypeId: z.string().min(1, 'Choose a leave type.'),
    startDate: z.string().min(1, 'Pick a start date.'),
    endDate: z.string().min(1, 'Pick an end date.'),
    reason: z.string().max(500, 'Keep the reason under 500 characters.').optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: 'The end date cannot be before the start date.',
    path: ['endDate'],
  })

type FileLeaveValues = z.infer<typeof schema>

function toIso(date: Date | undefined): string {
  if (!date) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function FileLeaveDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const employees = useQuery({ queryKey: employeeOptionsQueryKey, queryFn: fetchEmployeeOptions, enabled: open })
  const leaveTypes = useQuery({ queryKey: leaveTypesQueryKey, queryFn: fetchLeaveTypes, enabled: open })

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FileLeaveValues>({
    resolver: zodResolver(schema),
    defaultValues: { employeeId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '' },
  })

  // Fresh form every time the dialog opens, so a cancelled entry does not
  // reappear the next time it is opened.
  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  const start = watch('startDate')
  const end = watch('endDate')
  const days = start && end ? inclusiveDays(start, end) : 0

  const fileMutation = useMutation({
    mutationFn: (values: FileLeaveValues) =>
      fileLeaveRequest({
        employeeId: values.employeeId,
        leaveTypeId: values.leaveTypeId,
        startDate: values.startDate,
        endDate: values.endDate,
        daysRequested: inclusiveDays(values.startDate, values.endDate),
        reason: values.reason ?? '',
      }),
    onSuccess: () => {
      toast.success('Leave request filed')
      queryClient.invalidateQueries({ queryKey: leaveRequestsQueryKey })
      onOpenChange(false)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not file the request'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>File leave</DialogTitle>
          <DialogDescription>Record a leave request on behalf of an employee.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => fileMutation.mutate(values))}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="grid gap-2">
            <Label htmlFor="employee" required>
              Employee
            </Label>
            <Controller
              control={control}
              name="employeeId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="employee"
                    aria-invalid={errors.employeeId ? true : undefined}
                    className={errors.employeeId ? 'border-error' : undefined}
                  >
                    <SelectValue placeholder={employees.isPending ? 'Loading…' : 'Select an employee'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(employees.data ?? []).map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.employeeId ? <p className="text-xs text-error">{errors.employeeId.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="leave-type" required>
              Leave type
            </Label>
            <Controller
              control={control}
              name="leaveTypeId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="leave-type"
                    aria-invalid={errors.leaveTypeId ? true : undefined}
                    className={errors.leaveTypeId ? 'border-error' : undefined}
                  >
                    <SelectValue placeholder={leaveTypes.isPending ? 'Loading…' : 'Select a leave type'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(leaveTypes.data ?? []).map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.leaveTypeId ? <p className="text-xs text-error">{errors.leaveTypeId.message}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label required>Start date</Label>
              <Controller
                control={control}
                name="startDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
                    onChange={(date) => field.onChange(toIso(date))}
                    invalid={Boolean(errors.startDate)}
                  />
                )}
              />
              {errors.startDate ? <p className="text-xs text-error">{errors.startDate.message}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label required>End date</Label>
              <Controller
                control={control}
                name="endDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
                    onChange={(date) => field.onChange(toIso(date))}
                    invalid={Boolean(errors.endDate)}
                  />
                )}
              />
              {errors.endDate ? <p className="text-xs text-error">{errors.endDate.message}</p> : null}
            </div>
          </div>

          {days > 0 ? (
            <p className="text-sm text-body">
              <span className="tabular font-medium text-heading">{days}</span>{' '}
              {days === 1 ? 'day' : 'days'} requested.
            </p>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Controller
              control={control}
              name="reason"
              render={({ field }) => (
                <Textarea id="reason" placeholder="Optional context for the reviewer" {...field} />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={fileMutation.isPending}>
              {fileMutation.isPending ? 'Filing…' : 'File leave'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
