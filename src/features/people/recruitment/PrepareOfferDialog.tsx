import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { jobEmploymentTypeLabel, type JobEmploymentType } from '@/lib/jobPostingLabels'
import { interviewQueueQueryKey, interviewStatsQueryKey } from '@/services/interviews'
import {
  fetchOfferOptions,
  isFutureOfferDate,
  offerOptionsQueryKey,
  prepareJobOffer,
  type WorkScheduleOption,
} from '@/services/offers'
import { applicationsQueryKey } from '@/services/recruitment'

function localIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function tomorrowIsoDate(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return localIsoDate(tomorrow)
}

function formatPeso(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(value)
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function formatTime(value: string): string {
  const [hourText = '0', minute = '00'] = value.split(':')
  const hour = Number(hourText)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minute} ${suffix}`
}

function scheduleSummary(schedule: WorkScheduleOption): string {
  const days = schedule.workingDays.map((day) => DAY_LABELS[day] ?? `Day ${day}`).join(', ')
  return `${days} · ${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`
}

const schema = z.object({
  salaryGradeId: z.string().min(1, 'Choose a salary grade.'),
  proposedSalary: z.number({ message: 'Enter a valid salary.' }).positive('Enter a salary greater than zero.'),
  workScheduleId: z.string().min(1, 'Choose a work schedule.'),
  startDate: z.string().refine((value) => isFutureOfferDate(value), {
    message: 'Choose a start date of tomorrow or later.',
  }),
  benefits: z.string().max(4_000, 'Keep benefits under 4,000 characters.').optional(),
  additionalCompensation: z.string().max(4_000, 'Keep additional compensation under 4,000 characters.').optional(),
  notes: z.string().max(4_000, 'Keep notes under 4,000 characters.').optional(),
})

type OfferValues = z.infer<typeof schema>

export function PrepareOfferDialog({
  open,
  onOpenChange,
  applicationId,
  applicantName,
  positionTitle,
  department,
  employmentType,
  revision = false,
  onPrepared,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  applicantName: string
  positionTitle: string
  department: string | null
  employmentType: JobEmploymentType
  revision?: boolean
  onPrepared: () => void
}) {
  const queryClient = useQueryClient()
  const options = useQuery({
    queryKey: offerOptionsQueryKey(employmentType),
    queryFn: () => fetchOfferOptions(employmentType),
    enabled: open,
    staleTime: 60 * 60 * 1000,
  })

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<OfferValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      salaryGradeId: '',
      proposedSalary: 0,
      workScheduleId: '',
      startDate: '',
      benefits: '',
      additionalCompensation: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      salaryGradeId: '',
      proposedSalary: 0,
      workScheduleId: '',
      startDate: '',
      benefits: '',
      additionalCompensation: '',
      notes: '',
    })
  }, [applicationId, open, reset])

  const selectedGradeId = watch('salaryGradeId')
  const selectedScheduleId = watch('workScheduleId')
  const selectedGrade = options.data?.salaryGrades.find((grade) => grade.id === selectedGradeId) ?? null
  const selectedSchedule = options.data?.workSchedules.find((schedule) => schedule.id === selectedScheduleId) ?? null

  const mutation = useMutation({
    mutationFn: prepareJobOffer,
    onSuccess: () => {
      toast.success(revision ? 'Revised job offer prepared' : 'Job offer prepared')
      queryClient.invalidateQueries({ queryKey: applicationsQueryKey })
      queryClient.invalidateQueries({ queryKey: interviewQueueQueryKey })
      queryClient.invalidateQueries({ queryKey: interviewStatsQueryKey })
      onOpenChange(false)
      onPrepared()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not prepare the job offer'),
  })

  const submit = (values: OfferValues) => {
    const grade = options.data?.salaryGrades.find((option) => option.id === values.salaryGradeId)
    if (!grade) {
      setError('salaryGradeId', { message: 'That salary grade is no longer available.' })
      return
    }
    if (values.proposedSalary < grade.minSalary || values.proposedSalary > grade.maxSalary) {
      setError('proposedSalary', {
        message: `Enter an amount from ${formatPeso(grade.minSalary)} to ${formatPeso(grade.maxSalary)}.`,
      })
      return
    }

    const schedule = options.data?.workSchedules.find((option) => option.id === values.workScheduleId)
    if (!schedule) {
      setError('workScheduleId', { message: 'That work schedule is no longer available.' })
      return
    }

    mutation.mutate({
      applicationId,
      proposedSalary: values.proposedSalary,
      salaryGradeId: grade.id,
      workScheduleId: schedule.id,
      startDate: values.startDate,
      benefits: values.benefits,
      additionalCompensation: values.additionalCompensation,
      notes: values.notes,
    })
  }

  const noGrades = !options.isPending && !options.isError && options.data?.salaryGrades.length === 0
  const noSchedules = !options.isPending && !options.isError && options.data?.workSchedules.length === 0
  const unusable = options.isPending || options.isError || noGrades || noSchedules

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{revision ? 'Prepare revised job offer' : 'Prepare job offer'}</DialogTitle>
          <DialogDescription>
            {applicantName} · {positionTitle}{department ? ` · ${department}` : ''}. Employment type and schedule terms
            come from approved records and cannot be typed manually.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="offer-employment-type">Employment type</Label>
              <Input id="offer-employment-type" value={jobEmploymentTypeLabel(employmentType)} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="offer-currency">Currency</Label>
              <Input id="offer-currency" value="PHP" disabled />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="offer-salary-grade" required>
              Salary grade
            </Label>
            <Controller
              control={control}
              name="salaryGradeId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={unusable}>
                  <SelectTrigger
                    id="offer-salary-grade"
                    aria-invalid={errors.salaryGradeId ? true : undefined}
                    aria-describedby={
                      errors.salaryGradeId
                        ? 'offer-salary-grade-error'
                        : options.isError || noGrades
                          ? 'offer-salary-grade-help'
                          : selectedGrade
                            ? 'offer-salary-grade-range'
                            : undefined
                    }
                    className={errors.salaryGradeId ? 'border-error' : undefined}
                  >
                    <SelectValue placeholder={options.isPending ? 'Loading…' : 'Choose a salary grade'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(options.data?.salaryGrades ?? []).map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.salaryGradeId ? (
              <p id="offer-salary-grade-error" className="text-xs text-error">{errors.salaryGradeId.message}</p>
            ) : options.isError ? (
              <p id="offer-salary-grade-help" className="text-xs text-error">Could not load offer options. Refresh and try again.</p>
            ) : noGrades ? (
              <p id="offer-salary-grade-help" className="text-xs text-muted-foreground">No compatible salary grade is configured.</p>
            ) : selectedGrade ? (
              <p id="offer-salary-grade-range" className="text-xs text-muted-foreground">
                Range: {formatPeso(selectedGrade.minSalary)} - {formatPeso(selectedGrade.maxSalary)}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="offer-salary" required>
              Monthly salary
            </Label>
            <Input
              id="offer-salary"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              invalid={Boolean(errors.proposedSalary)}
              aria-describedby={errors.proposedSalary ? 'offer-salary-error' : undefined}
              {...register('proposedSalary', { valueAsNumber: true })}
            />
            {errors.proposedSalary ? (
              <p id="offer-salary-error" className="text-xs text-error">{errors.proposedSalary.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="offer-work-schedule" required>
              Work schedule
            </Label>
            <Controller
              control={control}
              name="workScheduleId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={unusable}>
                  <SelectTrigger
                    id="offer-work-schedule"
                    aria-invalid={errors.workScheduleId ? true : undefined}
                    aria-describedby={
                      errors.workScheduleId
                        ? 'offer-work-schedule-error'
                        : options.isError || noSchedules
                          ? 'offer-work-schedule-help'
                          : selectedSchedule
                            ? 'offer-work-schedule-summary'
                            : undefined
                    }
                    className={errors.workScheduleId ? 'border-error' : undefined}
                  >
                    <SelectValue placeholder={options.isPending ? 'Loading…' : 'Choose a work schedule'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(options.data?.workSchedules ?? []).map((schedule) => (
                      <SelectItem key={schedule.id} value={schedule.id}>
                        {schedule.name}{schedule.isDefault ? ' (default)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.workScheduleId ? (
              <p id="offer-work-schedule-error" className="text-xs text-error">{errors.workScheduleId.message}</p>
            ) : options.isError ? (
              <p id="offer-work-schedule-help" className="text-xs text-error">Could not load offer options. Refresh and try again.</p>
            ) : noSchedules ? (
              <p id="offer-work-schedule-help" className="text-xs text-muted-foreground">No compatible work schedule is configured.</p>
            ) : selectedSchedule ? (
              <p id="offer-work-schedule-summary" className="text-xs text-muted-foreground">
                {scheduleSummary(selectedSchedule)}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="offer-start-date" required>
              Start date
            </Label>
            <Input
              id="offer-start-date"
              type="date"
              min={tomorrowIsoDate()}
              invalid={Boolean(errors.startDate)}
              aria-describedby={errors.startDate ? 'offer-start-date-error' : undefined}
              {...register('startDate')}
            />
            {errors.startDate ? (
              <p id="offer-start-date-error" className="text-xs text-error">{errors.startDate.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="offer-benefits">Benefits</Label>
            <Textarea
              id="offer-benefits"
              rows={3}
              placeholder="Government benefits, leave, allowances…"
              invalid={Boolean(errors.benefits)}
              aria-describedby={errors.benefits ? 'offer-benefits-error' : undefined}
              {...register('benefits')}
            />
            {errors.benefits ? <p id="offer-benefits-error" className="text-xs text-error">{errors.benefits.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="offer-additional-compensation">Additional compensation</Label>
            <Textarea
              id="offer-additional-compensation"
              rows={2}
              placeholder="Optional bonus or incentive details."
              invalid={Boolean(errors.additionalCompensation)}
              aria-describedby={errors.additionalCompensation ? 'offer-additional-compensation-error' : undefined}
              {...register('additionalCompensation')}
            />
            {errors.additionalCompensation ? <p id="offer-additional-compensation-error" className="text-xs text-error">{errors.additionalCompensation.message}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="offer-notes">Internal notes</Label>
            <Textarea
              id="offer-notes"
              rows={2}
              placeholder="Optional preparation notes."
              invalid={Boolean(errors.notes)}
              aria-describedby={errors.notes ? 'offer-notes-error' : undefined}
              {...register('notes')}
            />
            {errors.notes ? <p id="offer-notes-error" className="text-xs text-error">{errors.notes.message}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || unusable}>
              {mutation.isPending ? 'Preparing…' : revision ? 'Prepare revised offer' : 'Prepare job offer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
